import { config } from './environment';

/**
 * OpenRouter AI Configuration
 * https://openrouter.ai/docs
 */
export const openRouterConfig = {
  apiKey: config.openrouter.apiKey,
  baseUrl: config.openrouter.baseUrl,
  defaultModel: config.openrouter.defaultModel,

  // Available models
  models: {
    gpt35: 'openai/gpt-3.5-turbo',
    gpt4: 'openai/gpt-4',
    gpt4Turbo: 'openai/gpt-4-turbo',
    claude3: 'anthropic/claude-3-opus',
    claude3Sonnet: 'anthropic/claude-3-sonnet',
    gemini: 'google/gemini-pro',
  },

  // Token costs per 1K tokens (in credits)
  tokenCosts: {
    'openai/gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'openai/gpt-4': { input: 0.03, output: 0.06 },
    'openai/gpt-4-turbo': { input: 0.01, output: 0.03 },
    'anthropic/claude-3-opus': { input: 0.015, output: 0.075 },
    'anthropic/claude-3-sonnet': { input: 0.003, output: 0.015 },
    'google/gemini-pro': { input: 0.000125, output: 0.000375 },
  },

  // Default parameters
  defaultParams: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  },

  // Feature-specific configurations
  features: {
    chat: {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
    },
    notesProcessing: {
      model: 'openai/gpt-4-turbo',
      maxTokens: 4000,
      temperature: 0.3,
    },
    flashcardGeneration: {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 2000,
      temperature: 0.5,
    },
    questionGeneration: {
      model: 'openai/gpt-4',
      maxTokens: 2000,
      temperature: 0.6,
    },
    summarization: {
      model: 'openai/gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.3,
    },
  },

  // Rate limiting
  rateLimits: {
    requestsPerMinute: 60,
    tokensPerMinute: 90000,
  },

  // Timeouts (in milliseconds)
  timeouts: {
    default: 30000, // 30 seconds
    notesProcessing: 120000, // 2 minutes
  },
} as const;

export type OpenRouterConfig = typeof openRouterConfig;
