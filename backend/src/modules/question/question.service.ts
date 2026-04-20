import { questionRepository } from './question.repository';
import {
  CreateQuestionDto,
  UpdateQuestionDto,
  QuestionResponseDto,
  QuestionFilters,
  RandomQuestionFilters,
  BulkImportQuestionDto,
  CreateQuestionOptionDto,
  UpdateQuestionOptionDto,
} from './question.types';
import {
  NotFoundException,
  BadRequestException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';
import { QuestionType } from '@prisma/client';

/**
 * Question Service
 * Handles all question-related business logic
 */
export class QuestionService {
  /**
   * Get all questions with filters and pagination
   */
  async getAllQuestions(
    filters: QuestionFilters,
    page: number = 1,
    limit: number = 10
  ) {
    const result = await questionRepository.findAll(filters, { page, limit });

    return {
      questions: result.questions.map((q) => this.mapToResponseDto(q)),
      pagination: result.pagination,
    };
  }

  /**
   * Get question by ID
   */
  async getQuestionById(
    id: string,
    includeOptions: boolean = true
  ): Promise<QuestionResponseDto> {
    const question = await questionRepository.findByIdWithStats(id);

    if (!question) {
      throw new NotFoundException('Question not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (!question.isActive) {
      throw new NotFoundException('Question not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return this.mapToResponseDto(question, includeOptions);
  }

  /**
   * Create new question (Admin only)
   */
  async createQuestion(
    data: CreateQuestionDto,
    userId?: string
  ): Promise<QuestionResponseDto> {
    // Validate options for MCQ and TRUE_FALSE
    this.validateQuestionOptions(data);

    // If topicId is provided, verify it exists
    if (data.topicId) {
      await this.verifyTopicExists(data.topicId);
    }

    const question = await questionRepository.create(data, userId);

    return this.mapToResponseDto(question);
  }

  /**
   * Update question (Admin only)
   */
  async updateQuestion(
    id: string,
    data: UpdateQuestionDto
  ): Promise<QuestionResponseDto> {
    // Check if question exists
    const exists = await questionRepository.exists(id);
    if (!exists) {
      throw new NotFoundException('Question not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Validate options if provided
    if (data.options) {
      this.validateQuestionOptions(data as CreateQuestionDto);
    }

    // If topicId is being updated, verify it exists
    if (data.topicId) {
      await this.verifyTopicExists(data.topicId);
    }

    const question = await questionRepository.update(id, data);

    return this.mapToResponseDto(question);
  }

  /**
   * Delete question (Admin only)
   */
  async deleteQuestion(id: string): Promise<void> {
    // Check if question exists
    const question = await questionRepository.findById(id, false);
    if (!question) {
      throw new NotFoundException('Question not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Check if question is used in any tests
    const isUsed = await questionRepository.isUsedInTests(id);
    if (isUsed) {
      throw new BadRequestException(
        'Cannot delete question that is used in tests. Please deactivate it instead.',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    // Soft delete question
    await questionRepository.delete(id);
  }

  /**
   * Get random questions
   */
  async getRandomQuestions(filters: RandomQuestionFilters) {
    const questions = await questionRepository.findRandom(filters);

    if (questions.length === 0) {
      throw new NotFoundException(
        'No questions found matching the criteria',
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Increment usage count for selected questions
    await Promise.all(
      questions.map((q) => questionRepository.incrementUsage(q.id))
    );

    return questions.map((q) => this.mapToResponseDto(q));
  }

  /**
   * Approve question (Admin only)
   */
  async approveQuestion(id: string): Promise<QuestionResponseDto> {
    // Check if question exists
    const question = await questionRepository.findById(id, false);
    if (!question) {
      throw new NotFoundException('Question not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (question.isApproved) {
      throw new BadRequestException(
        'Question is already approved',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    const approvedQuestion = await questionRepository.approve(id);

    return this.mapToResponseDto(approvedQuestion);
  }

  /**
   * Bulk import questions (Admin only)
   */
  async bulkImportQuestions(
    data: BulkImportQuestionDto,
    userId?: string
  ): Promise<{ imported: number; failed: number; errors: any[] }> {
    const errors: any[] = [];
    let imported = 0;

    for (let i = 0; i < data.questions.length; i++) {
      const questionData = data.questions[i];
      if (!questionData) continue;

      try {
        // Validate options
        this.validateQuestionOptions(questionData);

        // Verify topic exists if provided
        if (questionData.topicId) {
          await this.verifyTopicExists(questionData.topicId);
        }

        await questionRepository.create(questionData, userId);
        imported++;
      } catch (error: any) {
        errors.push({
          index: i,
          question: questionData.questionText.substring(0, 50),
          error: error.message,
        });
      }
    }

    return {
      imported,
      failed: errors.length,
      errors,
    };
  }

  /**
   * Update question statistics after test attempt
   */
  async updateQuestionStats(questionId: string, isCorrect: boolean): Promise<void> {
    await questionRepository.updateStats(questionId, isCorrect);
  }

  /**
   * Create question option
   */
  async createOption(
    questionId: string,
    data: CreateQuestionOptionDto
  ): Promise<any> {
    // Check if question exists
    const question = await questionRepository.findById(questionId, false);
    if (!question) {
      throw new NotFoundException('Question not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    return await questionRepository.createOption(questionId, data);
  }

  /**
   * Update question option
   */
  async updateOption(optionId: string, data: UpdateQuestionOptionDto): Promise<any> {
    // Check if option exists
    const option = await questionRepository.findOptionById(optionId);
    if (!option) {
      throw new NotFoundException(
        'Question option not found',
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    return await questionRepository.updateOption(optionId, data);
  }

  /**
   * Delete question option
   */
  async deleteOption(optionId: string): Promise<void> {
    // Check if option exists
    const option = await questionRepository.findOptionById(optionId);
    if (!option) {
      throw new NotFoundException(
        'Question option not found',
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Verify question will still have at least one correct option after deletion
    const question = await questionRepository.findById(option.questionId, true);
    if (question && option.isCorrect) {
      const otherCorrectOptions = question.options?.filter(
        (opt) => opt.id !== optionId && opt.isCorrect
      );
      if (!otherCorrectOptions || otherCorrectOptions.length === 0) {
        throw new BadRequestException(
          'Cannot delete the only correct option. Question must have at least one correct answer.',
          ERROR_CODES.RESOURCE_CONFLICT
        );
      }
    }

    await questionRepository.deleteOption(optionId);
  }

  /**
   * Validate question options
   */
  private validateQuestionOptions(data: CreateQuestionDto): void {
    const { questionType, options } = data;

    // MCQ and TRUE_FALSE must have options
    if (
      (questionType === QuestionType.MCQ || questionType === QuestionType.TRUE_FALSE) &&
      (!options || options.length === 0)
    ) {
      throw new BadRequestException(
        'MCQ and TRUE_FALSE questions must have options',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    if (!options) return;

    // MCQ must have 2-6 options
    if (questionType === QuestionType.MCQ && (options.length < 2 || options.length > 6)) {
      throw new BadRequestException(
        'MCQ must have between 2 and 6 options',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // TRUE_FALSE must have exactly 2 options
    if (questionType === QuestionType.TRUE_FALSE && options.length !== 2) {
      throw new BadRequestException(
        'TRUE_FALSE questions must have exactly 2 options',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Must have at least one correct option
    const hasCorrect = options.some((opt) => opt.isCorrect);
    if (!hasCorrect) {
      throw new BadRequestException(
        'At least one option must be marked as correct',
        ERROR_CODES.VALIDATION_ERROR
      );
    }
  }

  /**
   * Verify topic exists
   */
  private async verifyTopicExists(topicId: string): Promise<void> {
    const { prisma } = await import('@/config');
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic || !topic.isActive) {
      throw new NotFoundException('Topic not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }
  }

  /**
   * Map question to response DTO
   */
  private mapToResponseDto(question: any, includeOptions: boolean = true): QuestionResponseDto {
    const successRate =
      question.totalAttempts > 0
        ? (question.correctAttempts / question.totalAttempts) * 100
        : 0;

    return {
      id: question.id,
      topicId: question.topicId,
      questionType: question.questionType,
      questionText: question.questionText,
      questionImageUrl: question.questionImageUrl,
      explanation: question.explanation,
      difficultyLevel: question.difficultyLevel,
      tags: question.tags || [],
      source: question.source,
      usageCount: question.usageCount,
      correctAttempts: question.correctAttempts,
      totalAttempts: question.totalAttempts,
      successRate: Math.round(successRate * 100) / 100,
      isActive: question.isActive,
      isApproved: question.isApproved,
      options: includeOptions && question.options ? question.options : undefined,
      topic: question.topic,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    };
  }
}

export const questionService = new QuestionService();
