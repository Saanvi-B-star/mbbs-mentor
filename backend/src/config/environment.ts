import { z } from 'zod';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Environment variable validation schema using Zod
 */
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('8000'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis (Optional - required for background jobs)
  REDIS_URL: z.string().url().optional(),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT refresh secret must be at least 32 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // AWS (Optional - required for file uploads, email, and OCR)
  AWS_REGION: z.string().optional().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),
  AWS_S3_BUCKET_REGION: z.string().optional().default('us-east-1'),
  AWS_SES_REGION: z.string().optional().default('us-east-1'),
  AWS_SES_FROM_EMAIL: z.string().email().optional(),
  AWS_SES_FROM_NAME: z.string().optional().default('MBBS Mentor'),
  AWS_TEXTRACT_REGION: z.string().optional().default('us-east-1'),

  // OpenRouter AI
  OPENROUTER_API_KEY: z.string(),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_DEFAULT_MODEL: z.string().default('openai/gpt-3.5-turbo'),

  // OpenAI (for embeddings)
  OPENAI_API_KEY: z.string(),

  // Pinecone (vector database)
  PINECONE_API_KEY: z.string(),
  PINECONE_INDEX_NAME: z.string().default('mbbs-index'),

  // Razorpay (Optional - required for payments)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),
});

/**
 * Parse and validate environment variables
 */
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:');
      console.error(error.errors);
      throw new Error('Invalid environment variables');
    }
    throw error;
  }
};

const env = parseEnv();

/**
 * Application configuration object
 * All configuration values are centralized here
 */
export const config = {
  // Application
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT),
  corsOrigin: env.CORS_ORIGIN.split(','),
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  serverUrl: env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : `http://localhost:${env.PORT}`,

  // Database
  database: {
    url: env.DATABASE_URL,
  },

  // Redis (Optional)
  redis: {
    url: env.REDIS_URL,
    enabled: !!env.REDIS_URL,
  },

  // JWT
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  // AWS (Optional)
  aws: {
    enabled: !!(env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY),
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
    s3: {
      enabled: !!(env.AWS_S3_BUCKET_NAME && env.AWS_ACCESS_KEY_ID),
      bucketName: env.AWS_S3_BUCKET_NAME,
      region: env.AWS_S3_BUCKET_REGION,
    },
    ses: {
      enabled: !!(env.AWS_SES_FROM_EMAIL && env.AWS_ACCESS_KEY_ID),
      region: env.AWS_SES_REGION,
      fromEmail: env.AWS_SES_FROM_EMAIL,
      fromName: env.AWS_SES_FROM_NAME,
    },
    textract: {
      enabled: !!env.AWS_ACCESS_KEY_ID,
      region: env.AWS_TEXTRACT_REGION,
    },
  },

  // OpenRouter AI
  openrouter: {
    apiKey: env.OPENROUTER_API_KEY,
    baseUrl: env.OPENROUTER_BASE_URL,
    defaultModel: env.OPENROUTER_DEFAULT_MODEL,
  },

  // OpenAI (for embeddings)
  openai: {
    apiKey: env.OPENAI_API_KEY,
  },

  // Pinecone (vector database)
  pinecone: {
    apiKey: env.PINECONE_API_KEY,
    indexName: env.PINECONE_INDEX_NAME,
  },

  // Razorpay (Optional)
  razorpay: {
    enabled: !!(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
    webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
  },

  // OAuth
  oauth: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: env.APPLE_CLIENT_ID,
      clientSecret: env.APPLE_CLIENT_SECRET,
    },
  },

  // For backward compatibility - direct access to Google OAuth credentials
  googleClientId: env.GOOGLE_CLIENT_ID,
  googleClientSecret: env.GOOGLE_CLIENT_SECRET,
} as const;

export type Config = typeof config;
