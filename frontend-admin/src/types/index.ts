export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
}

export interface PlatformStats {
  totalNotes: number;
  totalAIQueries: number;
  activeSessions: number;
  avgSessionDuration: number;
}

export interface AnalyticsData {
  date: string;
  users: number;
  notes: number;
  queries: number;
}
