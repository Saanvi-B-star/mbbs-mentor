import { prisma } from '@/config';
import {
  CreateTestDto,
  SubmitAnswerDto,
  TestFilters,
  GenerateTestCriteria,
} from './test.types';
import { questionRepository } from '../question/question.repository';
import { Decimal } from '@prisma/client/runtime/library';
import { BadRequestException } from '@/shared/exceptions';

/**
 * Test Repository
 * Handles all test-related database operations
 */
export class TestRepository {
  /**
   * Create a test
   */
  async createTest(userId: string, data: CreateTestDto, tokenCost?: number) {
    const { topicIds = [], subjectIds = [], ...testData } = data;

    return await prisma.test.create({
      data: {
        userId,
        ...testData,
        topicIds,
        subjectIds,
        tokenCost,
        status: 'PUBLISHED',
      },
    });
  }

  /**
   * Find test by ID
   */
  async findTestById(testId: string, includeQuestions: boolean = false) {
    return await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testQuestions: includeQuestions
          ? {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' },
                  },
                  topic: {
                    select: {
                      id: true,
                      name: true,
                      subjectId: true,
                    },
                  },
                },
              },
            },
          }
          : false,
      },
    });
  }

  /**
   * Find user's tests
   */
  async findUserTests(
    userId: string,
    filters?: TestFilters,
    options?: { page?: number; limit?: number }
  ) {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (filters?.testType) {
      where.testType = filters.testType;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const [tests, total] = await Promise.all([
      prisma.test.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              testQuestions: true,
              testAttempts: true,
            },
          },
        },
      }),
      prisma.test.count({ where }),
    ]);

    return {
      tests,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Generate test with questions
   */
  async generateTest(userId: string, criteria: GenerateTestCriteria, tokenCost?: number) {
    // Validate totalQuestions is a positive number
    if (!criteria.totalQuestions || criteria.totalQuestions <= 0) {
      throw new BadRequestException(
        'Total questions must be a positive number',
        'INVALID_QUESTION_COUNT'
      );
    }

    // Fetch random questions based on criteria
    const questions = await questionRepository.findRandom({
      topicIds: criteria.topicIds,
      subjectIds: criteria.subjectIds,
      difficultyLevel: criteria.difficultyLevel,
      questionTypes: criteria.questionTypes,
      count: criteria.totalQuestions,
    });

    if (questions.length === 0) {
      throw new BadRequestException(
        'No questions found matching the criteria. Try adjusting filters or select different difficulty/subject.',
        'NO_QUESTIONS_FOUND'
      );
    }

    // Create test with questions in a transaction
    return await prisma.$transaction(async (tx) => {
      // Create the test
      const test = await tx.test.create({
        data: {
          userId,
          title: criteria.title,
          testType: criteria.testType,
          subjectIds: criteria.subjectIds || [],
          topicIds: criteria.topicIds || [],
          totalQuestions: questions.length,
          duration: criteria.duration,
          difficultyLevel: criteria.difficultyLevel,
          status: 'PUBLISHED',
          tokenCost,
        },
      });

      // Create test questions
      const testQuestions = questions.map((question, index) => ({
        testId: test.id,
        questionId: question.id,
        order: index + 1,
        marks: new Decimal(1.0), // Default 1 mark per question
      }));

      await tx.testQuestion.createMany({
        data: testQuestions,
      });

      // Increment usage count for all questions
      await Promise.all(
        questions.map((q) =>
          tx.question.update({
            where: { id: q.id },
            data: { usageCount: { increment: 1 } },
          })
        )
      );

      // Return test with questions
      return await tx.test.findUnique({
        where: { id: test.id },
        include: {
          testQuestions: {
            orderBy: { order: 'asc' },
            include: {
              question: {
                include: {
                  options: {
                    orderBy: { sortOrder: 'asc' },
                  },
                  topic: {
                    select: {
                      id: true,
                      name: true,
                      subjectId: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Create test attempt
   */
  async createAttempt(testId: string, userId: string) {
    return await prisma.testAttempt.create({
      data: {
        testId,
        userId,
        startTime: new Date(),
        status: 'IN_PROGRESS',
      },
      include: {
        test: {
          include: {
            testQuestions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find attempt by ID
   */
  async findAttemptById(attemptId: string, includeAnswers: boolean = false) {
    return await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            testQuestions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    options: {
                      orderBy: { sortOrder: 'asc' },
                    },
                    topic: true,
                  },
                },
              },
            },
          },
        },
        testAnswers: includeAnswers
          ? {
            include: {
              question: {
                include: {
                  options: true,
                  topic: true,
                },
              },
              selectedOption: true,
            },
          }
          : false,
      },
    });
  }

  /**
   * Submit answer
   */
  async submitAnswer(data: SubmitAnswerDto) {
    const { testAttemptId, questionId, selectedOptionId, answerText, timeTaken, isFlagged } =
      data;

    // Check if answer already exists
    const existingAnswer = await prisma.testAnswer.findFirst({
      where: {
        testAttemptId,
        questionId,
      },
    });

    if (existingAnswer) {
      // Update existing answer
      return await prisma.testAnswer.update({
        where: { id: existingAnswer.id },
        data: {
          selectedOptionId,
          answerText,
          timeTaken,
          isFlagged: isFlagged ?? false,
        },
      });
    }

    // Create new answer
    return await prisma.testAnswer.create({
      data: {
        testAttemptId,
        questionId,
        selectedOptionId,
        answerText,
        timeTaken,
        isFlagged: isFlagged ?? false,
      },
    });
  }

  /**
   * Submit test and calculate scores
   */
  async submitTest(attemptId: string) {
    return await prisma.$transaction(async (tx) => {
      // Get attempt with answers and questions
      const attempt = await tx.testAttempt.findUnique({
        where: { id: attemptId },
        include: {
          test: {
            include: {
              testQuestions: {
                include: {
                  question: {
                    include: {
                      options: true,
                    },
                  },
                },
              },
            },
          },
          testAnswers: {
            include: {
              selectedOption: true,
            },
          },
        },
      });

      if (!attempt) {
        throw new Error('Test attempt not found');
      }

      if (attempt.status === 'COMPLETED') {
        throw new Error('Test already submitted');
      }

      // Calculate scores
      let totalScore = 0;
      const maxScore = attempt.test.testQuestions.length;

      // Evaluate each question in the test
      for (const testQuestion of attempt.test.testQuestions) {
        const answer = attempt.testAnswers.find(
          (a) => a.questionId === testQuestion.questionId
        );

        let isCorrect = false;
        let marksObtained = 0;

        if (answer) {
          // Evaluation logic depends on question type
          const qType = testQuestion.question.questionType;

          if (qType === 'MCQ' || qType === 'TRUE_FALSE') {
            if (answer.selectedOptionId) {
              const selectedOption = testQuestion.question.options.find(
                (opt) => opt.id === answer.selectedOptionId
              );

              if (selectedOption && selectedOption.isCorrect) {
                isCorrect = true;
                marksObtained = Number(testQuestion.marks);
                totalScore += marksObtained;
              }
            }
          } else if (qType === 'SAQ') {
            // For now, SAQ requires manual review or exact match
            // We'll mark as incorrect by default if no auto-grading is set up
            // but we at least record that it was answered if answerText exists
            isCorrect = false; 
            marksObtained = 0;
          }

          // Update answer with evaluation
          await tx.testAnswer.update({
            where: { id: answer.id },
            data: {
              isCorrect,
              marksObtained: new Decimal(marksObtained),
            },
          });

          // Update question statistics
          await tx.question.update({
            where: { id: answer.questionId },
            data: {
              totalAttempts: { increment: 1 },
              correctAttempts: isCorrect ? { increment: 1 } : undefined,
            },
          });
        }
      }

      // Calculate percentage
      const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

      // Calculate time taken
      const startTime = new Date(attempt.startTime);
      const endTime = new Date();
      const timeTakenMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / 60000);

      // Update attempt with final scores
      return await tx.testAttempt.update({
        where: { id: attemptId },
        data: {
          status: 'COMPLETED',
          endTime,
          timeTaken: timeTakenMinutes,
          totalScore: new Decimal(totalScore),
          maxScore: new Decimal(maxScore),
          percentage: new Decimal(percentage),
        },
        include: {
          test: {
            include: {
              testQuestions: {
                orderBy: { order: 'asc' },
                include: {
                  question: {
                    include: {
                      options: true,
                      topic: {
                        include: {
                          subject: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          testAnswers: {
            include: {
              question: {
                include: {
                  options: true,
                  topic: {
                    include: {
                      subject: true,
                    },
                  },
                },
              },
              selectedOption: true,
            },
          },
        },
      });
    });
  }

  /**
   * Get test results
   */
  async getTestResults(attemptId: string) {
    return await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            testQuestions: {
              orderBy: { order: 'asc' },
              include: {
                question: {
                  include: {
                    options: true,
                    topic: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        testAnswers: {
          include: {
            question: {
              include: {
                options: true,
                topic: {
                  include: {
                    subject: true,
                  },
                },
              },
            },
            selectedOption: true,
          },
        },
      },
    });
  }

  /**
   * Get user's test attempts
   */
  async getUserAttempts(
    userId: string,
    options?: { page?: number; limit?: number; testId?: string }
  ) {
    const { page = 1, limit = 10, testId } = options || {};
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (testId) {
      where.testId = testId;
    }

    const [attempts, total] = await Promise.all([
      prisma.testAttempt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          test: {
            select: {
              id: true,
              title: true,
              testType: true,
              totalQuestions: true,
              duration: true,
            },
          },
        },
      }),
      prisma.testAttempt.count({ where }),
    ]);

    return {
      attempts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delete test
   */
  async deleteTest(testId: string) {
    // Check if test has any attempts
    const attemptCount = await prisma.testAttempt.count({
      where: { testId },
    });

    if (attemptCount > 0) {
      // Soft delete by changing status
      return await prisma.test.update({
        where: { id: testId },
        data: { status: 'ARCHIVED' },
      });
    }

    // Hard delete if no attempts
    return await prisma.test.delete({
      where: { id: testId },
    });
  }

  /**
   * Check if test exists and belongs to user
   */
  async isTestOwner(testId: string, userId: string): Promise<boolean> {
    const count = await prisma.test.count({
      where: {
        id: testId,
        userId,
      },
    });
    return count > 0;
  }

  /**
   * Check if attempt belongs to user
   */
  async isAttemptOwner(attemptId: string, userId: string): Promise<boolean> {
    const count = await prisma.testAttempt.count({
      where: {
        id: attemptId,
        userId,
      },
    });
    return count > 0;
  }

  /**
   * Get answer by attempt and question
   */
  async getAnswer(attemptId: string, questionId: string) {
    return await prisma.testAnswer.findFirst({
      where: {
        testAttemptId: attemptId,
        questionId,
      },
    });
  }
}

export const testRepository = new TestRepository();
