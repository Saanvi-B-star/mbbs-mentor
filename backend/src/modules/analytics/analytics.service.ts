import { prisma } from '@/config';
import { analyticsRepository } from './analytics.repository';
import { NotFoundException } from '@/shared/exceptions';
import { ERROR_CODES } from '@/shared/constants';
import {
  UserAnalyticsDto,
  TestAnalyticsDto,
  PlatformAnalyticsDto,
  SubjectComparisonDto,
  TopicMasteryDto,
  StudyTimeAnalyticsDto,
  RevenueStatsDto,
  DateRangeFilter,
  TopicMastery,
  DifficultyAnalytics,
  SubjectAnalytics,
  TopicAnalytics,
} from './analytics.types';

/**
 * Analytics Service
 * Handles analytics business logic and data aggregation
 */
export class AnalyticsService {
  /**
   * Get comprehensive user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalyticsDto> {
    const [stats, subjectPerformance, recentActivity, progressOverTime] = await Promise.all([
      analyticsRepository.getUserStats(userId),
      analyticsRepository.getUserSubjectPerformance(userId),
      analyticsRepository.getUserRecentActivity(userId, 20),
      analyticsRepository.getUserProgressOverTime(userId, 30),
    ]);

    // Sort subjects by performance
    const sortedSubjects = [...subjectPerformance].sort((a, b) => b.accuracy - a.accuracy);

    // Get top 3 strong subjects and bottom 3 weak subjects
    const strongSubjects = sortedSubjects.slice(0, 3);
    const weakSubjects = sortedSubjects.slice(-3).reverse();

    return {
      userId,
      ...stats,
      strongSubjects,
      weakSubjects,
      recentActivity,
      progressOverTime,
    };
  }

  /**
   * Get test analytics for a specific attempt
   */
  async getTestAnalytics(userId: string, attemptId: string): Promise<TestAnalyticsDto> {
    const attempt = await analyticsRepository.getTestAnalytics(attemptId);

    if (!attempt) {
      throw new NotFoundException('Test attempt not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    if (attempt.userId !== userId) {
      throw new NotFoundException('Test attempt not found', ERROR_CODES.RESOURCE_NOT_FOUND);
    }

    // Calculate overall statistics
    const totalQuestions = attempt.testAnswers.length;
    const correctAnswers = attempt.testAnswers.filter((r) => r.isCorrect).length;
    const incorrectAnswers = attempt.testAnswers.filter(
      (r) => !r.isCorrect && r.selectedOptionId !== null
    ).length;
    const unansweredQuestions = attempt.testAnswers.filter((r) => r.selectedOptionId === null).length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const avgTimePerQuestion = totalQuestions > 0 ? (attempt.timeTaken || 0) / totalQuestions : 0;

    // Subject-wise analysis
    const subjectMap = new Map<string, any>();
    attempt.testAnswers.forEach((response) => {
      const topic = response.question.topic;
      if (!topic) return;
      const subject = topic.subject;
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

    const subjectWise: SubjectAnalytics[] = Array.from(subjectMap.values()).map((subject) => ({
      ...subject,
      accuracy: (subject.correctAnswers / subject.questionsAttempted) * 100,
    }));

    // Topic-wise analysis
    const topicMap = new Map<string, any>();
    attempt.testAnswers.forEach((response) => {
      const topic = response.question.topic;
      if (!topic) return;
      const topicId = topic.id;

      if (!topicMap.has(topicId)) {
        topicMap.set(topicId, {
          topicId,
          topicName: topic.name,
          questionsAttempted: 0,
          correctAnswers: 0,
        });
      }

      const topicData = topicMap.get(topicId);
      topicData.questionsAttempted++;
      if (response.isCorrect) {
        topicData.correctAnswers++;
      }
    });

    const topicWise: TopicAnalytics[] = Array.from(topicMap.values()).map((topic) => ({
      ...topic,
      accuracy: (topic.correctAnswers / topic.questionsAttempted) * 100,
    }));

    // Difficulty-wise analysis
    const difficultyMap = new Map<string, any>();
    attempt.testAnswers.forEach((response) => {
      const difficulty = (response.question as any).difficultyLevel || 'MEDIUM';

      if (!difficultyMap.has(difficulty)) {
        difficultyMap.set(difficulty, {
          level: difficulty,
          questionsAttempted: 0,
          correctAnswers: 0,
        });
      }

      const difficultyData = difficultyMap.get(difficulty);
      difficultyData.questionsAttempted++;
      if (response.isCorrect) {
        difficultyData.correctAnswers++;
      }
    });

    const difficultyWise: DifficultyAnalytics[] = Array.from(difficultyMap.values()).map(
      (difficulty) => ({
        ...difficulty,
        accuracy: (difficulty.correctAnswers / difficulty.questionsAttempted) * 100,
      })
    );

    // Generate recommendations
    const recommendations = this.generateRecommendationsFromAnalytics(
      subjectWise,
      topicWise,
      difficultyWise,
      accuracy
    );

    return {
      attemptId,
      overall: {
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unansweredQuestions,
        accuracy: Number(accuracy.toFixed(2)),
        totalScore: Number(attempt.totalScore || 0),
        maxScore: Number(attempt.maxScore || 0),
        percentage: Number(attempt.percentage || 0),
        timeTaken: attempt.timeTaken || 0,
        avgTimePerQuestion: Number(avgTimePerQuestion.toFixed(2)),
      },
      subjectWise,
      topicWise,
      difficultyWise,
      recommendations,
    };
  }

  /**
   * Get platform analytics (Admin only)
   */
  async getPlatformAnalytics(): Promise<PlatformAnalyticsDto> {
    const [platformStats, userGrowth, engagementMetrics, subscriptionBreakdown] =
      await Promise.all([
        analyticsRepository.getPlatformStats(),
        analyticsRepository.getUserGrowth(30),
        analyticsRepository.getEngagementMetrics(),
        analyticsRepository.getSubscriptionBreakdown(),
      ]);

    return {
      ...platformStats,
      subscriptionBreakdown,
      userGrowth,
      engagementMetrics,
    };
  }

  /**
   * Generate recommendations based on user performance
   */
  private generateRecommendationsFromAnalytics(
    subjectWise: SubjectAnalytics[],
    topicWise: TopicAnalytics[],
    difficultyWise: DifficultyAnalytics[],
    overallAccuracy: number
  ): string[] {
    const recommendations: string[] = [];

    // Overall performance recommendations
    if (overallAccuracy < 40) {
      recommendations.push(
        'Your overall performance needs improvement. Focus on understanding fundamental concepts.'
      );
    } else if (overallAccuracy < 60) {
      recommendations.push(
        'You are making progress. Spend more time on practice questions to improve your score.'
      );
    } else if (overallAccuracy < 80) {
      recommendations.push(
        'Good performance! Focus on weak areas to reach excellence.'
      );
    } else {
      recommendations.push(
        'Excellent performance! Keep up the good work and maintain consistency.'
      );
    }

    // Subject-specific recommendations
    const weakSubjects = subjectWise.filter((s) => s.accuracy < 60).slice(0, 3);
    if (weakSubjects.length > 0) {
      recommendations.push(
        `Focus more on: ${weakSubjects.map((s) => s.subjectName).join(', ')}`
      );
    }

    // Topic-specific recommendations
    const weakTopics = topicWise.filter((t) => t.accuracy < 50).slice(0, 3);
    if (weakTopics.length > 0) {
      recommendations.push(
        `Practice more questions on: ${weakTopics.map((t) => t.topicName).join(', ')}`
      );
    }

    // Difficulty-based recommendations
    const easyDifficulty = difficultyWise.find((d) => d.level === 'EASY');
    const hardDifficulty = difficultyWise.find((d) => d.level === 'HARD');

    if (easyDifficulty && easyDifficulty.accuracy < 70) {
      recommendations.push(
        'Focus on basic concepts. Your performance on easy questions needs improvement.'
      );
    }

    if (hardDifficulty && hardDifficulty.accuracy > 70) {
      recommendations.push(
        'You are doing well with difficult questions. Challenge yourself with more advanced topics.'
      );
    }

    return recommendations;
  }

  /**
   * Generate recommendations based on user's weak areas
   */
  async generateRecommendations(userId: string): Promise<string[]> {
    const analytics = await this.getUserAnalytics(userId);
    const recommendations: string[] = [];

    // Based on average score
    if (analytics.averageScore < 40) {
      recommendations.push(
        'Your overall performance needs improvement. Consider revising basic concepts.'
      );
    } else if (analytics.averageScore < 60) {
      recommendations.push('Practice more questions to improve your understanding.');
    } else if (analytics.averageScore >= 80) {
      recommendations.push('Excellent performance! Keep maintaining this consistency.');
    }

    // Based on weak subjects
    if (analytics.weakSubjects.length > 0) {
      const weakestSubject = analytics.weakSubjects[0];
      if (weakestSubject) {
        recommendations.push(
          `Focus more on ${weakestSubject.subjectName} where your accuracy is ${weakestSubject.accuracy.toFixed(1)}%`
        );
      }
    }

    // Based on study time
    if (analytics.totalStudyTime < 300) {
      // Less than 5 hours
      recommendations.push('Try to increase your study time for better results.');
    }

    // Based on test completion rate
    const completionRate = analytics.totalTests > 0
      ? (analytics.completedTests / analytics.totalTests) * 100
      : 0;
    if (completionRate < 80 && analytics.totalTests > 5) {
      recommendations.push('Complete more tests to improve your performance tracking.');
    }

    return recommendations;
  }

  /**
   * Get subject comparison for user
   */
  async getSubjectComparison(userId: string): Promise<SubjectComparisonDto> {
    const subjects = await analyticsRepository.getUserSubjectPerformance(userId);

    const overallAverage =
      subjects.length > 0
        ? subjects.reduce((sum, s) => sum + s.accuracy, 0) / subjects.length
        : 0;

    return {
      userId,
      subjects,
      overallAverage: Number(overallAverage.toFixed(2)),
    };
  }

  /**
   * Get difficulty analysis for user
   */
  async getDifficultyAnalysis(userId: string) {
    // TODO: Implement difficulty analysis using test performance data
    await analyticsRepository.getUserTestPerformance(userId);

    // This would need more detailed implementation based on responses
    // For now, returning a placeholder
    return {
      userId,
      analysis: [],
    };
  }

  /**
   * Get topic mastery for user
   */
  async getTopicMastery(userId: string): Promise<TopicMasteryDto> {
    // TODO: Implement topic mastery using subject performance data
    await analyticsRepository.getUserSubjectPerformance(userId);

    // This is a simplified version - in a real implementation,
    // you would query actual topic-level data
    const topics: TopicMastery[] = [];

    return {
      userId,
      topics,
    };
  }

  /**
   * Get study time analytics
   */
  async getStudyTimeAnalytics(userId: string, period: string = '30d'): Promise<StudyTimeAnalyticsDto> {
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const progressData = await analyticsRepository.getUserProgressOverTime(userId, days);

    const totalStudyTime = progressData.reduce((sum, data) => sum + data.studyTime, 0);

    const byDay = progressData.map((data) => ({
      date: data.date,
      duration: data.studyTime,
    }));

    // Subject-wise study time would require additional queries
    const bySubject: any[] = [];

    return {
      userId,
      period,
      totalStudyTime,
      byDay,
      bySubject,
    };
  }

  /**
   * Get revenue statistics (Admin only)
   */
  async getRevenueStats(dateRange?: DateRangeFilter): Promise<RevenueStatsDto> {
    const revenueData = await analyticsRepository.getRevenueStats(dateRange);
    const totalUsers = await analyticsRepository.getPlatformStats();

    // Process revenue by plan
    const revenueByPlan = await Promise.all(
      revenueData.revenueByPlan.map(async (item: any) => {
        const plan = await prisma.subscriptionPlan.findUnique({
          where: { id: item.planId },
        });

        return {
          planId: item.planId,
          planName: plan?.name || 'Unknown',
          revenue: Number(plan?.price || 0) * item._count.id,
          subscriptionCount: item._count.id,
        };
      })
    );

    // Group payments by date
    const revenueMap = new Map<string, any>();
    revenueData.payments.forEach((payment: any) => {
      const date = payment.createdAt.toISOString().split('T')[0];
      if (!revenueMap.has(date)) {
        revenueMap.set(date, {
          date,
          revenue: 0,
          subscriptions: 0,
        });
      }
      const data = revenueMap.get(date);
      data.revenue += Number(payment.amount);
      data.subscriptions += 1;
    });

    const revenueOverTime = Array.from(revenueMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const avgRevenuePerUser =
      totalUsers.totalUsers > 0 ? Number(revenueData.totalRevenue) / totalUsers.totalUsers : 0;

    return {
      totalRevenue: Number(revenueData.totalRevenue),
      revenueByPlan,
      revenueOverTime,
      avgRevenuePerUser: Number(avgRevenuePerUser.toFixed(2)),
    };
  }
}

export const analyticsService = new AnalyticsService();
