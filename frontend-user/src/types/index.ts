export interface User {
  id: string;
  name: string;
  email: string;
  role: "student" | "admin";
  currentTokenBalance: number;
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

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
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
