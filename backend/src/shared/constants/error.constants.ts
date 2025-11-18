/**
 * Error Constants
 * Error codes and messages for consistent error handling
 */

/**
 * Error Codes
 */
export const ERROR_CODES = {
  // Authentication Errors (1xxx)
  AUTH_INVALID_CREDENTIALS: 'AUTH_1001',
  AUTH_TOKEN_EXPIRED: 'AUTH_1002',
  AUTH_TOKEN_INVALID: 'AUTH_1003',
  AUTH_USER_NOT_FOUND: 'AUTH_1004',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_1005',
  AUTH_ACCOUNT_BANNED: 'AUTH_1006',
  AUTH_ACCOUNT_INACTIVE: 'AUTH_1007',

  // Validation Errors (2xxx)
  VALIDATION_FAILED: 'VAL_2001',
  VALIDATION_EMAIL_INVALID: 'VAL_2002',
  VALIDATION_PASSWORD_WEAK: 'VAL_2003',
  VALIDATION_REQUIRED_FIELD: 'VAL_2004',

  // Resource Errors (3xxx)
  RESOURCE_NOT_FOUND: 'RES_3001',
  RESOURCE_ALREADY_EXISTS: 'RES_3002',
  RESOURCE_CONFLICT: 'RES_3003',

  // Token Errors (4xxx)
  TOKEN_INSUFFICIENT_BALANCE: 'TOK_4001',
  TOKEN_INVALID_AMOUNT: 'TOK_4002',
  TOKEN_TRANSACTION_FAILED: 'TOK_4003',

  // Subscription Errors (5xxx)
  SUBSCRIPTION_NOT_FOUND: 'SUB_5001',
  SUBSCRIPTION_EXPIRED: 'SUB_5002',
  SUBSCRIPTION_INACTIVE: 'SUB_5003',
  SUBSCRIPTION_ALREADY_EXISTS: 'SUB_5004',

  // Payment Errors (6xxx)
  PAYMENT_FAILED: 'PAY_6001',
  PAYMENT_VERIFICATION_FAILED: 'PAY_6002',
  PAYMENT_REFUND_FAILED: 'PAY_6003',
  PAYMENT_WEBHOOK_INVALID: 'PAY_6004',

  // File Upload Errors (7xxx)
  FILE_TOO_LARGE: 'FILE_7001',
  FILE_INVALID_TYPE: 'FILE_7002',
  FILE_UPLOAD_FAILED: 'FILE_7003',
  FILE_PROCESSING_FAILED: 'FILE_7004',

  // AI/OpenRouter Errors (8xxx)
  AI_REQUEST_FAILED: 'AI_8001',
  AI_RATE_LIMIT_EXCEEDED: 'AI_8002',
  AI_INVALID_MODEL: 'AI_8003',
  AI_TIMEOUT: 'AI_8004',

  // Database Errors (9xxx)
  DB_CONNECTION_FAILED: 'DB_9001',
  DB_QUERY_FAILED: 'DB_9002',
  DB_TRANSACTION_FAILED: 'DB_9003',

  // Generic Errors
  INTERNAL_SERVER_ERROR: 'ERR_0001',
  RATE_LIMIT_EXCEEDED: 'ERR_0002',
  SERVICE_UNAVAILABLE: 'ERR_0003',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  // Authentication
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password',
  [ERROR_CODES.AUTH_TOKEN_EXPIRED]: 'Authentication token has expired',
  [ERROR_CODES.AUTH_TOKEN_INVALID]: 'Invalid authentication token',
  [ERROR_CODES.AUTH_USER_NOT_FOUND]: 'User not found',
  [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: 'Email not verified. Please verify your email.',
  [ERROR_CODES.AUTH_ACCOUNT_BANNED]: 'Your account has been banned',
  [ERROR_CODES.AUTH_ACCOUNT_INACTIVE]: 'Your account is inactive',

  // Validation
  [ERROR_CODES.VALIDATION_FAILED]: 'Validation failed',
  [ERROR_CODES.VALIDATION_EMAIL_INVALID]: 'Invalid email address',
  [ERROR_CODES.VALIDATION_PASSWORD_WEAK]: 'Password is too weak. Must be at least 8 characters.',
  [ERROR_CODES.VALIDATION_REQUIRED_FIELD]: 'Required field is missing',

  // Resources
  [ERROR_CODES.RESOURCE_NOT_FOUND]: 'Requested resource not found',
  [ERROR_CODES.RESOURCE_ALREADY_EXISTS]: 'Resource already exists',
  [ERROR_CODES.RESOURCE_CONFLICT]: 'Resource conflict detected',

  // Tokens
  [ERROR_CODES.TOKEN_INSUFFICIENT_BALANCE]: 'Insufficient token balance. Please upgrade your plan.',
  [ERROR_CODES.TOKEN_INVALID_AMOUNT]: 'Invalid token amount',
  [ERROR_CODES.TOKEN_TRANSACTION_FAILED]: 'Token transaction failed',

  // Subscriptions
  [ERROR_CODES.SUBSCRIPTION_NOT_FOUND]: 'Subscription not found',
  [ERROR_CODES.SUBSCRIPTION_EXPIRED]: 'Your subscription has expired',
  [ERROR_CODES.SUBSCRIPTION_INACTIVE]: 'Subscription is inactive',
  [ERROR_CODES.SUBSCRIPTION_ALREADY_EXISTS]: 'Active subscription already exists',

  // Payments
  [ERROR_CODES.PAYMENT_FAILED]: 'Payment failed. Please try again.',
  [ERROR_CODES.PAYMENT_VERIFICATION_FAILED]: 'Payment verification failed',
  [ERROR_CODES.PAYMENT_REFUND_FAILED]: 'Refund failed',
  [ERROR_CODES.PAYMENT_WEBHOOK_INVALID]: 'Invalid webhook signature',

  // File Upload
  [ERROR_CODES.FILE_TOO_LARGE]: 'File size exceeds maximum limit (10MB)',
  [ERROR_CODES.FILE_INVALID_TYPE]: 'Invalid file type. Only PDF, PNG, JPG allowed.',
  [ERROR_CODES.FILE_UPLOAD_FAILED]: 'File upload failed',
  [ERROR_CODES.FILE_PROCESSING_FAILED]: 'File processing failed',

  // AI/OpenRouter
  [ERROR_CODES.AI_REQUEST_FAILED]: 'AI request failed',
  [ERROR_CODES.AI_RATE_LIMIT_EXCEEDED]: 'AI rate limit exceeded. Please try again later.',
  [ERROR_CODES.AI_INVALID_MODEL]: 'Invalid AI model specified',
  [ERROR_CODES.AI_TIMEOUT]: 'AI request timed out',

  // Database
  [ERROR_CODES.DB_CONNECTION_FAILED]: 'Database connection failed',
  [ERROR_CODES.DB_QUERY_FAILED]: 'Database query failed',
  [ERROR_CODES.DB_TRANSACTION_FAILED]: 'Database transaction failed',

  // Generic
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Internal server error',
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
} as const;
