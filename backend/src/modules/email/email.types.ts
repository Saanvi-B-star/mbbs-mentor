/**
 * Email Module Type Definitions
 */

export interface SendEmailDto {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface EmailTemplateData {
  userName: string;
  [key: string]: any;
}

export enum EmailTemplate {
  WELCOME = 'welcome',
  EMAIL_VERIFICATION = 'email-verification',
  PASSWORD_RESET = 'password-reset',
  SUBSCRIPTION_ACTIVATED = 'subscription-activated',
  SUBSCRIPTION_EXPIRING = 'subscription-expiring',
  TEST_COMPLETED = 'test-completed',
  NOTE_PROCESSED = 'note-processed',
  LOW_TOKEN_BALANCE = 'low-token-balance',
}

export interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface WelcomeEmailData {
  userName: string;
  verificationLink: string;
}

export interface VerificationEmailData {
  userName: string;
  verificationLink: string;
}

export interface PasswordResetEmailData {
  userName: string;
  resetLink: string;
}

export interface SubscriptionActivatedEmailData {
  userName: string;
  planName: string;
  expiryDate: string;
  tokens: number;
}

export interface SubscriptionExpiringEmailData {
  userName: string;
  expiryDate: string;
  daysRemaining: number;
}

export interface TestCompletedEmailData {
  userName: string;
  testName: string;
  score: number;
  percentage: number;
  detailsLink: string;
}

export interface NoteProcessedEmailData {
  userName: string;
  noteTitle: string;
  noteLink: string;
  status: 'success' | 'failed';
  errorMessage?: string;
}

export interface LowTokenBalanceEmailData {
  userName: string;
  currentBalance: number;
  upgradeLink: string;
}
