/**
 * Global Type Definitions
 */

/**
 * Environment Variables
 */
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PORT: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    OPENROUTER_API_KEY: string;
    RAZORPAY_KEY_ID: string;
    RAZORPAY_KEY_SECRET: string;
  }
}

export {};
