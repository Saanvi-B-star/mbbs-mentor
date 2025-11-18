/**
 * Token System Constants
 * Token costs for various features and operations
 */

/**
 * Token Costs per Feature
 */
export const TOKEN_COSTS = {
  // AI Features
  AI_CHAT_MESSAGE: 3,
  AI_GENERATE_NOTES: 10,
  AI_GENERATE_FLASHCARDS: 5,
  AI_GENERATE_SUMMARY: 3,
  AI_GENERATE_QUESTIONS: 8,

  // Notes Processing
  NOTES_UPLOAD_OCR: 5,
  NOTES_FORMAT_AI: 10,
  NOTES_GENERATE_SUMMARY: 3,

  // Test Features
  TEST_GENERATE_PRACTICE: 5,
  TEST_GENERATE_MOCK: 10,
  TEST_INSTANT_EVALUATION: 2,

  // Study Materials
  MATERIAL_VIEW_PREMIUM: 2,
  MATERIAL_DOWNLOAD_PREMIUM: 3,

  // Other Features
  DIAGRAM_GENERATION: 5,
  FLASHCARD_GENERATION: 5,
} as const;

/**
 * Initial Token Allocation
 */
export const INITIAL_TOKENS = {
  FREE_SIGNUP: 100,
  EMAIL_VERIFICATION: 50,
  REFERRAL_BONUS: 100,
  DAILY_LOGIN_BONUS: 10,
} as const;

/**
 * Subscription Token Allocations
 */
export const SUBSCRIPTION_TOKENS = {
  FREE: 100,
  PREMIUM_MONTHLY: 1000,
  PREMIUM_QUARTERLY: 3500,
  PREMIUM_YEARLY: 15000,
  PRO_MONTHLY: 2500,
  PRO_QUARTERLY: 8000,
  PRO_YEARLY: 35000,
} as const;

/**
 * Token Transaction Types
 */
export const TRANSACTION_TYPES = {
  EARNED: 'EARNED',
  SPENT: 'SPENT',
  BONUS: 'BONUS',
  REFUND: 'REFUND',
  ADJUSTMENT: 'ADJUSTMENT',
} as const;

/**
 * Token Balance Thresholds
 */
export const TOKEN_THRESHOLDS = {
  LOW_BALANCE_WARNING: 50,
  CRITICAL_BALANCE_WARNING: 10,
  MINIMUM_BALANCE_FOR_AI: 3,
} as const;
