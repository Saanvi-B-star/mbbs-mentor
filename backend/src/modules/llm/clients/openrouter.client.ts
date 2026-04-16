/**
 * OpenRouter Client
 * Singleton client using OpenAI SDK for OpenRouter API
 */

import OpenAI from 'openai';
import { config } from '@/config';

/**
 * OpenRouter client instance
 * Uses OpenAI SDK with custom baseURL
 */
const openrouterClient = new OpenAI({
  apiKey: config.openrouter.apiKey,
  baseURL: config.openrouter.baseUrl,
  defaultHeaders: {
    'HTTP-Referer': config.serverUrl,
    'X-Title': 'MBBS Mentor',
  },
});

export { openrouterClient };
