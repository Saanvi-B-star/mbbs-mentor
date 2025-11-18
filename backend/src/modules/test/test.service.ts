import { testRepository } from './test.repository';
import { tokenService } from '../token/token.service';
import {
  GenerateTestCriteria,
  TestResponseDto,
  TestAttemptResponseDto,
  SubmitAnswerDto,
  TestResultDto,
  SubjectPerformance,
  TopicPerformance,
} from './test.types';
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';

/**
 * Test Service
 * Handles all test-related business logic
 */
export class TestService {
  private readonly TEST_GENERATION_COST = 5; // Tokens per test

  /**
   * Generate a new test
   */
  async generateTest(
    userId: string,
    criteria: GenerateTestCriteria
  ): Promise<TestResponseDto> {
    // Check token balance
    const balance = await tokenService.getBalance(userId);
    if (balance.currentBalance < this.TEST_GENERATION_COST) {
      throw new BadRequestException(
        `Insufficient tokens. Required: ${this.TEST_GENERATION_COST}, Current: ${balance.currentBalance}`,
        ERROR_CODES.TOKEN_INSUFFICIENT_BALANCE
      );
    }

    // Validate criteria
    if (!criteria.topicIds?.length && !criteria.subjectIds?.length) {
      throw new BadRequestException(
        'Either topicIds or subjectIds must be provided',
        ERROR_CODES.VALIDATION_ERROR
      );
    }

    // Generate test with questions
    const test = await testRepository.generateTest(
      userId,
      criteria,
      this.TEST_GENERATION_COST
    );

    if (!test) {
      throw new BadRequestException(
        'Failed to generate test. No questions found matching the criteria.',
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    // Deduct tokens
    await tokenService.deductTokens({
      userId,
      amount: this.TEST_GENERATION_COST,
      feature: 'test_generation',
      referenceId: test.id,
      description: `Generated test: ${test.title || 'Untitled'}`,
    });

    return this.mapToTestResponseDto(test);
  }

  /**
   * Get user's tests
   */
  async getUserTests(userId: string, page: number = 1, limit: number = 10) {
    const result = await testRepository.findUserTests(userId, {}, { page, limit });

    return {
      tests: result.tests.map((test) => this.mapToTestResponseDto(test)),
      pagination: result.pagination,
    };
  }

  /**
   * Get test by ID
   */
  async getTestById(id: string, userId: string): Promise<TestResponseDto> {
    const test = await testRepository.findTestById(id, true);

    if (!test) {
      throw new NotFoundException('Test not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Verify ownership
    if (test.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have access to this test',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    return this.mapToTestResponseDto(test);
  }

  /**
   * Start a test attempt
   */
  async startTest(userId: string, testId: string): Promise<TestAttemptResponseDto> {
    const test = await testRepository.findTestById(testId);

    if (!test) {
      throw new NotFoundException('Test not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Verify ownership
    if (test.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have access to this test',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Create test attempt
    const attempt = await testRepository.createAttempt(testId, userId);

    return this.mapToAttemptResponseDto(attempt);
  }

  /**
   * Submit an answer
   */
  async submitAnswer(
    userId: string,
    attemptId: string,
    data: Omit<SubmitAnswerDto, 'testAttemptId'>
  ): Promise<void> {
    // Verify attempt ownership
    const isOwner = await testRepository.isAttemptOwner(attemptId, userId);
    if (!isOwner) {
      throw new UnauthorizedException(
        'You do not have access to this test attempt',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Check if attempt is still in progress
    const attempt = await testRepository.findAttemptById(attemptId);
    if (!attempt) {
      throw new NotFoundException('Test attempt not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (attempt.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        'Cannot submit answer. Test is already completed.',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    // Submit answer
    await testRepository.submitAnswer({
      testAttemptId: attemptId,
      ...data,
    });
  }

  /**
   * Submit test
   */
  async submitTest(userId: string, attemptId: string): Promise<TestResultDto> {
    // Verify attempt ownership
    const isOwner = await testRepository.isAttemptOwner(attemptId, userId);
    if (!isOwner) {
      throw new UnauthorizedException(
        'You do not have access to this test attempt',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    // Submit test and calculate scores
    const result = await testRepository.submitTest(attemptId);

    return this.mapToTestResultDto(result);
  }

  /**
   * Get test results
   */
  async getTestResults(userId: string, attemptId: string): Promise<TestResultDto> {
    // Verify attempt ownership
    const isOwner = await testRepository.isAttemptOwner(attemptId, userId);
    if (!isOwner) {
      throw new UnauthorizedException(
        'You do not have access to this test attempt',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    const attempt = await testRepository.getTestResults(attemptId);

    if (!attempt) {
      throw new NotFoundException(
        'Test attempt not found',
        ERROR_CODES.RESOURCE_NOT_FOUND
      );
    }

    if (attempt.status !== 'COMPLETED') {
      throw new BadRequestException(
        'Test is not completed yet',
        ERROR_CODES.RESOURCE_CONFLICT
      );
    }

    return this.mapToTestResultDto(attempt);
  }

  /**
   * Get user's test attempts
   */
  async getUserAttempts(
    userId: string,
    page: number = 1,
    limit: number = 10,
    testId?: string
  ) {
    const result = await testRepository.getUserAttempts(userId, {
      page,
      limit,
      testId,
    });

    return {
      attempts: result.attempts.map((attempt) => this.mapToAttemptResponseDto(attempt)),
      pagination: result.pagination,
    };
  }

  /**
   * Delete test
   */
  async deleteTest(id: string, userId: string): Promise<void> {
    const test = await testRepository.findTestById(id);

    if (!test) {
      throw new NotFoundException('Test not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Verify ownership
    if (test.userId !== userId) {
      throw new UnauthorizedException(
        'You do not have permission to delete this test',
        ERROR_CODES.UNAUTHORIZED
      );
    }

    await testRepository.deleteTest(id);
  }

  /**
   * Get test analytics
   */
  async getTestAnalytics(attemptId: string, userId: string): Promise<TestResultDto> {
    return await this.getTestResults(userId, attemptId);
  }

  /**
   * Map test to response DTO
   */
  private mapToTestResponseDto(test: any): TestResponseDto {
    return {
      id: test.id,
      userId: test.userId,
      title: test.title,
      testType: test.testType,
      subjectIds: test.subjectIds || [],
      topicIds: test.topicIds || [],
      totalQuestions: test.totalQuestions,
      duration: test.duration,
      difficultyLevel: test.difficultyLevel,
      status: test.status,
      tokenCost: test.tokenCost,
      questions: test.testQuestions?.map((tq: any) => ({
        id: tq.id,
        questionId: tq.questionId,
        order: tq.order,
        marks: Number(tq.marks),
        question: tq.question,
      })),
      createdAt: test.createdAt,
    };
  }

  /**
   * Map attempt to response DTO
   */
  private mapToAttemptResponseDto(attempt: any): TestAttemptResponseDto {
    return {
      id: attempt.id,
      testId: attempt.testId,
      userId: attempt.userId,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      timeTaken: attempt.timeTaken,
      totalScore: attempt.totalScore ? Number(attempt.totalScore) : null,
      maxScore: attempt.maxScore ? Number(attempt.maxScore) : null,
      percentage: attempt.percentage ? Number(attempt.percentage) : null,
      status: attempt.status,
      test: attempt.test,
      answers: attempt.testAnswers?.map((answer: any) => ({
        id: answer.id,
        questionId: answer.questionId,
        selectedOptionId: answer.selectedOptionId,
        answerText: answer.answerText,
        isCorrect: answer.isCorrect,
        marksObtained: answer.marksObtained ? Number(answer.marksObtained) : null,
        timeTaken: answer.timeTaken,
        isFlagged: answer.isFlagged,
      })),
    };
  }

  /**
   * Map attempt to test result DTO with analytics
   */
  private mapToTestResultDto(attempt: any): TestResultDto {
    const baseDto = this.mapToAttemptResponseDto(attempt);

    // Calculate analytics
    const answers = attempt.testAnswers || [];
    const correctAnswers = answers.filter((a: any) => a.isCorrect === true).length;
    const incorrectAnswers = answers.filter((a: any) => a.isCorrect === false).length;
    const totalQuestions = attempt.test?.testQuestions?.length || 0;
    const unansweredQuestions = totalQuestions - answers.length;

    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const timePerQuestion =
      answers.length > 0 && attempt.timeTaken ? attempt.timeTaken / answers.length : 0;

    // Calculate subject-wise performance
    const subjectWisePerformance = this.calculateSubjectPerformance(attempt);

    // Calculate topic-wise performance
    const topicWisePerformance = this.calculateTopicPerformance(attempt);

    return {
      ...baseDto,
      correctAnswers,
      incorrectAnswers,
      unansweredQuestions,
      accuracy: Math.round(accuracy * 100) / 100,
      timePerQuestion: Math.round(timePerQuestion * 100) / 100,
      subjectWisePerformance,
      topicWisePerformance,
    };
  }

  /**
   * Calculate subject-wise performance
   */
  private calculateSubjectPerformance(attempt: any): SubjectPerformance[] {
    const subjectMap = new Map<string, SubjectPerformance>();

    const testQuestions = attempt.test?.testQuestions || [];
    const answers = attempt.testAnswers || [];

    testQuestions.forEach((tq: any) => {
      const subject = tq.question?.topic?.subject;
      if (!subject) return;

      if (!subjectMap.has(subject.id)) {
        subjectMap.set(subject.id, {
          subjectId: subject.id,
          subjectName: subject.name,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          unanswered: 0,
          accuracy: 0,
          score: 0,
          maxScore: 0,
        });
      }

      const subjectPerf = subjectMap.get(subject.id)!;
      subjectPerf.totalQuestions += 1;
      subjectPerf.maxScore += Number(tq.marks);

      const answer = answers.find((a: any) => a.questionId === tq.questionId);
      if (answer) {
        if (answer.isCorrect) {
          subjectPerf.correctAnswers += 1;
          subjectPerf.score += Number(answer.marksObtained || 0);
        } else if (answer.isCorrect === false) {
          subjectPerf.incorrectAnswers += 1;
        }
      } else {
        subjectPerf.unanswered += 1;
      }
    });

    // Calculate accuracy for each subject
    subjectMap.forEach((perf) => {
      perf.accuracy =
        perf.totalQuestions > 0
          ? Math.round((perf.correctAnswers / perf.totalQuestions) * 100 * 100) / 100
          : 0;
    });

    return Array.from(subjectMap.values());
  }

  /**
   * Calculate topic-wise performance
   */
  private calculateTopicPerformance(attempt: any): TopicPerformance[] {
    const topicMap = new Map<string, TopicPerformance>();

    const testQuestions = attempt.test?.testQuestions || [];
    const answers = attempt.testAnswers || [];

    testQuestions.forEach((tq: any) => {
      const topic = tq.question?.topic;
      if (!topic) return;

      if (!topicMap.has(topic.id)) {
        topicMap.set(topic.id, {
          topicId: topic.id,
          topicName: topic.name,
          totalQuestions: 0,
          correctAnswers: 0,
          incorrectAnswers: 0,
          unanswered: 0,
          accuracy: 0,
        });
      }

      const topicPerf = topicMap.get(topic.id)!;
      topicPerf.totalQuestions += 1;

      const answer = answers.find((a: any) => a.questionId === tq.questionId);
      if (answer) {
        if (answer.isCorrect) {
          topicPerf.correctAnswers += 1;
        } else if (answer.isCorrect === false) {
          topicPerf.incorrectAnswers += 1;
        }
      } else {
        topicPerf.unanswered += 1;
      }
    });

    // Calculate accuracy for each topic
    topicMap.forEach((perf) => {
      perf.accuracy =
        perf.totalQuestions > 0
          ? Math.round((perf.correctAnswers / perf.totalQuestions) * 100 * 100) / 100
          : 0;
    });

    return Array.from(topicMap.values());
  }
}

export const testService = new TestService();
