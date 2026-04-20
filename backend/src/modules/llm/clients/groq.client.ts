/**
 * Groq Client
 * Singleton client using OpenAI SDK for Groq API
 */

import OpenAI from 'openai';
import { config } from '@/config';

/**
 * Groq client instance
 * Uses OpenAI SDK with Groq's baseURL
 */
const groqClient = config.groq.apiKey
  ? new OpenAI({
      apiKey: config.groq.apiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

export { groqClient };
