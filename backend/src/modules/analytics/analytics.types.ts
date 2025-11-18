/**
 * Analytics Module Type Definitions
 */

export interface UserAnalyticsDto {
  userId: string;
  totalTests: number;
  completedTests: number;
  averageScore: number;
  totalStudyTime: number; // minutes
  totalTokensSpent: number;
  aiInteractions: number;
  notesUploaded: number;
  bookmarkCount: number;
  strongSubjects: SubjectPerformance[];
  weakSubjects: SubjectPerformance[];
  recentActivity: ActivityItem[];
  progressOverTime: ProgressDataPoint[];
}

export interface SubjectPerformance {
  subjectId: string;
  subjectName: string;
  testsAttempted: number;
  averageScore: number;
  accuracy: number;
}

export interface ActivityItem {
  type: string; // 'test', 'study', 'ai', 'note'
  description: string;
  timestamp: Date;
}

export interface ProgressDataPoint {
  date: string;
  testsCompleted: number;
  averageScore: number;
  studyTime: number;
}

export interface PlatformAnalyticsDto {
  totalUsers: number;
  activeUsers: number;
  totalTests: number;
  totalQuestions: number;
  totalRevenue: number;
  subscriptionBreakdown: SubscriptionBreakdown[];
  userGrowth: UserGrowthPoint[];
  engagementMetrics: EngagementMetrics;
}

export interface SubscriptionBreakdown {
  planId: string;
  planName: string;
  activeSubscriptions: number;
  revenue: number;
}

export interface UserGrowthPoint {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  avgSessionDuration: number;
  avgTestsPerUser: number;
}

export interface TestAnalyticsDto {
  attemptId: string;
  overall: {
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    unansweredQuestions: number;
    accuracy: number;
    totalScore: number;
    maxScore: number;
    percentage: number;
    timeTaken: number;
    avgTimePerQuestion: number;
  };
  subjectWise: SubjectAnalytics[];
  topicWise: TopicAnalytics[];
  difficultyWise: DifficultyAnalytics[];
  recommendations: string[];
}

export interface SubjectAnalytics {
  subjectId: string;
  subjectName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
}

export interface TopicAnalytics {
  topicId: string;
  topicName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
}

export interface DifficultyAnalytics {
  level: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
}

export interface DateRangeFilter {
  startDate?: Date;
  endDate?: Date;
}

export interface SubjectComparisonDto {
  userId: string;
  subjects: SubjectPerformance[];
  overallAverage: number;
}

export interface TopicMasteryDto {
  userId: string;
  topics: TopicMastery[];
}

export interface TopicMastery {
  topicId: string;
  topicName: string;
  subjectName: string;
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  masteryLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  lastAttempted?: Date;
}

export interface StudyTimeAnalyticsDto {
  userId: string;
  period: string;
  totalStudyTime: number;
  byDay: DailyStudyTime[];
  bySubject: SubjectStudyTime[];
}

export interface DailyStudyTime {
  date: string;
  duration: number;
}

export interface SubjectStudyTime {
  subjectId: string;
  subjectName: string;
  duration: number;
}

export interface RevenueStatsDto {
  totalRevenue: number;
  revenueByPlan: RevenuePlan[];
  revenueOverTime: RevenuePoint[];
  avgRevenuePerUser: number;
}

export interface RevenuePlan {
  planId: string;
  planName: string;
  revenue: number;
  subscriptionCount: number;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  subscriptions: number;
}
