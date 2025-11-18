/**
 * Standard API Response Interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
}

/**
 * API Error Interface
 */
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * API Meta Information
 */
export interface ApiMeta {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMeta;
}

/**
 * Pagination Interface
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Pagination Query Parameters
 */
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Query Parameters
 */
export interface SearchQuery extends PaginationQuery {
  q?: string;
  filters?: Record<string, any>;
}
