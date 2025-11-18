import { prisma } from '@/config';
import { DateRangeFilter } from './analytics.types';

/**
 * Analytics Repository
 * Handles all analytics-related database queries
 */
export class AnalyticsRepository {
  /**
   * Get user stats
   */
  async getUserStats(userId: string) {
    const [
      totalTests,
      completedTests,
      totalStudyTime,
      totalTokensSpent,
      aiInteractions,
      notesUploaded,
      bookmarkCount,
      averageScore,
    ] = await Promise.all([
      // Total tests attempted
      prisma.testAttempt.count({
        where: { userId },
      }),

      // Completed tests
      prisma.testAttempt.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),

      // Total study time (in seconds, convert to minutes)
      prisma.studySession.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),

      // Total tokens spent
      prisma.tokenTransaction.aggregate({
        where: {
          userId,
          transactionType: 'SPENT',
        },
        _sum: { amount: true },
      }),

      // AI interactions
      prisma.aIConversation.count({
        where: { userId },
      }),

      // Notes uploaded
      prisma.note.count({
        where: { userId },
      }),

      // Bookmarks
      prisma.bookmark.count({
        where: { userId },
      }),

      // Average test score
      prisma.testAttempt.aggregate({
        where: {
          userId,
          status: 'COMPLETED',
        },
        _avg: { percentage: true },
      }),
    ]);

    return {
      totalTests,
      completedTests,
      totalStudyTime: Math.floor((totalStudyTime._sum.duration || 0) / 60), // Convert to minutes
      totalTokensSpent: Math.abs(totalTokensSpent._sum.amount || 0),
      aiInteractions,
      notesUploaded,
      bookmarkCount,
      averageScore: averageScore._avg.percentage
        ? Number(averageScore._avg.percentage.toFixed(2))
        : 0,
    };
  }

  /**
   * Get user test performance within date range
   */
  async getUserTestPerformance(userId: string, dateRange?: DateRangeFilter) {
    const where: any = {
      userId,
      status: 'COMPLETED',
    };

    if (dateRange?.startDate || dateRange?.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
      if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    const tests = await prisma.testAttempt.findMany({
      where,
      select: {
        id: true,
        testId: true,
        totalScore: true,
        maxScore: true,
        percentage: true,
        timeTaken: true,
        createdAt: true,
        test: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tests;
  }

  /**
   * Get user subject performance
   */
  async getUserSubjectPerformance(userId: string) {
    const testAttempts = await prisma.testAttempt.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      include: {
        test: {
          include: {
            questions: {
              include: {
                question: {
                  include: {
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
        responses: {
          include: {
            question: {
              include: {
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
    });

    // Group by subject
    const subjectMap = new Map<string, any>();

    testAttempts.forEach((attempt) => {
      attempt.responses.forEach((response) => {
        const subject = response.question.topic.subject;
        const subjectId = subject.id;

        if (!subjectMap.has(subjectId)) {
          subjectMap.set(subjectId, {
            subjectId,
            subjectName: subject.name,
            questionsAttempted: 0,
            correctAnswers: 0,
          });
        }

        const subjectData = subjectMap.get(subjectId);
        subjectData.questionsAttempted++;
        if (response.isCorrect) {
          subjectData.correctAnswers++;
        }
      });
    });

    // Calculate accuracy
    const subjects = Array.from(subjectMap.values()).map((subject) => ({
      ...subject,
      averageScore: (subject.correctAnswers / subject.questionsAttempted) * 100,
      accuracy: (subject.correctAnswers / subject.questionsAttempted) * 100,
      testsAttempted: testAttempts.length,
    }));

    return subjects;
  }

  /**
   * Get user recent activity
   */
  async getUserRecentActivity(userId: string, limit: number = 20) {
    const [testAttempts, studySessions, aiConversations, notes] = await Promise.all([
      // Recent test attempts
      prisma.testAttempt.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          status: true,
          test: {
            select: { title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),

      // Recent study sessions
      prisma.studySession.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          duration: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),

      // Recent AI conversations
      prisma.aIConversation.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          title: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),

      // Recent notes
      prisma.note.findMany({
        where: { userId },
        select: {
          id: true,
          createdAt: true,
          title: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
    ]);

    // Combine and sort all activities
    const activities: any[] = [];

    testAttempts.forEach((test) => {
      activities.push({
        type: 'test',
        description: `Attempted test: ${test.test.title}`,
        timestamp: test.createdAt,
      });
    });

    studySessions.forEach((session) => {
      activities.push({
        type: 'study',
        description: `Studied for ${Math.floor(session.duration / 60)} minutes`,
        timestamp: session.createdAt,
      });
    });

    aiConversations.forEach((conversation) => {
      activities.push({
        type: 'ai',
        description: `AI Chat: ${conversation.title || 'New conversation'}`,
        timestamp: conversation.createdAt,
      });
    });

    notes.forEach((note) => {
      activities.push({
        type: 'note',
        description: `Uploaded note: ${note.title}`,
        timestamp: note.createdAt,
      });
    });

    // Sort by timestamp and limit
    return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);
  }

  /**
   * Get user progress over time
   */
  async getUserProgressOverTime(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [testAttempts, studySessions] = await Promise.all([
      prisma.testAttempt.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        select: {
          percentage: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),

      prisma.studySession.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        select: {
          duration: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // Group by date
    const dateMap = new Map<string, any>();

    testAttempts.forEach((attempt) => {
      const date = attempt.createdAt.toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          testsCompleted: 0,
          totalScore: 0,
          studyTime: 0,
        });
      }
      const data = dateMap.get(date);
      data.testsCompleted++;
      data.totalScore += Number(attempt.percentage);
    });

    studySessions.forEach((session) => {
      const date = session.createdAt.toISOString().split('T')[0];
      if (!dateMap.has(date)) {
        dateMap.set(date, {
          date,
          testsCompleted: 0,
          totalScore: 0,
          studyTime: 0,
        });
      }
      const data = dateMap.get(date);
      data.studyTime += Math.floor(session.duration / 60);
    });

    // Calculate average scores and format
    const progressData = Array.from(dateMap.values()).map((data) => ({
      date: data.date,
      testsCompleted: data.testsCompleted,
      averageScore: data.testsCompleted > 0 ? data.totalScore / data.testsCompleted : 0,
      studyTime: data.studyTime,
    }));

    return progressData.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get test analytics for a specific attempt
   */
  async getTestAnalytics(attemptId: string) {
    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        test: {
          include: {
            questions: {
              include: {
                question: true,
              },
            },
          },
        },
        responses: {
          include: {
            question: {
              include: {
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
    });

    return attempt;
  }

  /**
   * Get platform stats (Admin only)
   */
  async getPlatformStats() {
    const [totalUsers, activeUsers, totalTests, totalQuestions, totalRevenue] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in last 30 days)
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Total tests
      prisma.test.count(),

      // Total questions
      prisma.question.count(),

      // Total revenue
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalTests,
      totalQuestions,
      totalRevenue: totalRevenue._sum.amount || 0,
    };
  }

  /**
   * Get user growth (Admin only)
   */
  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dateMap = new Map<string, number>();
    users.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    let totalUsers = await prisma.user.count({
      where: {
        createdAt: { lt: startDate },
      },
    });

    const growth = Array.from(dateMap.entries()).map(([date, newUsers]) => {
      totalUsers += newUsers;
      return { date, newUsers, totalUsers };
    });

    return growth;
  }

  /**
   * Get engagement metrics (Admin only)
   */
  async getEngagementMetrics() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      avgSessionDuration,
      totalTests,
      totalUsers,
    ] = await Promise.all([
      // Daily active users
      prisma.user.count({
        where: { lastLogin: { gte: oneDayAgo } },
      }),

      // Weekly active users
      prisma.user.count({
        where: { lastLogin: { gte: oneWeekAgo } },
      }),

      // Monthly active users
      prisma.user.count({
        where: { lastLogin: { gte: oneMonthAgo } },
      }),

      // Average session duration
      prisma.studySession.aggregate({
        _avg: { duration: true },
      }),

      // Total test attempts
      prisma.testAttempt.count(),

      // Total users
      prisma.user.count(),
    ]);

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      avgSessionDuration: Math.floor((avgSessionDuration._avg.duration || 0) / 60), // minutes
      avgTestsPerUser: totalUsers > 0 ? totalTests / totalUsers : 0,
    };
  }

  /**
   * Get revenue stats (Admin only)
   */
  async getRevenueStats(dateRange?: DateRangeFilter) {
    const where: any = { status: 'SUCCESS' };

    if (dateRange?.startDate || dateRange?.endDate) {
      where.createdAt = {};
      if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
      if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
    }

    const [totalRevenue, revenueByPlan, payments] = await Promise.all([
      // Total revenue
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
      }),

      // Revenue by plan
      prisma.subscription.groupBy({
        by: ['planId'],
        where: {
          status: 'ACTIVE',
        },
        _count: { id: true },
      }),

      // All payments for timeline
      prisma.payment.findMany({
        where,
        select: {
          amount: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      revenueByPlan,
      payments,
    };
  }

  /**
   * Get subscription breakdown (Admin only)
   */
  async getSubscriptionBreakdown() {
    const subscriptions = await prisma.subscription.groupBy({
      by: ['planId'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    });

    const subscriptionDetails = await Promise.all(
      subscriptions.map(async (sub) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: sub.planId },
        });

        return {
          planId: sub.planId,
          planName: plan?.name || 'Unknown',
          activeSubscriptions: sub._count.id,
          revenue: (plan?.price || 0) * sub._count.id,
        };
      })
    );

    return subscriptionDetails;
  }
}

export const analyticsRepository = new AnalyticsRepository();
