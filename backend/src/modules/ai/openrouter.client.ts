import axios, { AxiosInstance } from 'axios';
import { openRouterConfig } from '@/config/openrouter.config';
import { AIChatMessage } from './ai.types';
import { logger } from '@/config';

/**
 * OpenRouter Client Service
 * Handles communication with OpenRouter API
 */
export class OpenRouterClientService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: openRouterConfig.baseUrl,
      headers: {
        Authorization: `Bearer ${openRouterConfig.apiKey}`,
        'HTTP-Referer': 'https://mbbs-mentor.com', // Required by OpenRouter
        'X-Title': 'MBBS Mentor', // Optional, helps with rankings
        'Content-Type': 'application/json',
      },
      timeout: openRouterConfig.timeouts.default,
    });
  }

  /**
   * Send chat completion request
   */
  async createChatCompletion(
    messages: AIChatMessage[],
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
      topP?: number;
    }
  ) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: options?.model || openRouterConfig.defaultModel,
        messages,
        temperature: options?.temperature ?? openRouterConfig.defaultParams.temperature,
        max_tokens: options?.maxTokens ?? openRouterConfig.defaultParams.max_tokens,
        top_p: options?.topP ?? openRouterConfig.defaultParams.top_p,
      });

      return response.data;
    } catch (error: any) {
      logger.error('OpenRouter API error', {
        error: error.message,
        response: error.response?.data,
      });

      throw new Error(
        `OpenRouter API request failed: ${error.response?.data?.error?.message || error.message}`
      );
    }
  }

  /**
   * Generate text from prompt
   */
  async generateText(
    prompt: string,
    systemPrompt?: string,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ): Promise<{ content: string; tokensUsed: number }> {
    const messages: AIChatMessage[] = [];

    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    messages.push({
      role: 'user',
      content: prompt,
    });

    const response = await this.createChatCompletion(messages, options);

    return {
      content: response.choices[0].message.content,
      tokensUsed: response.usage.total_tokens,
    };
  }

  /**
   * Stream chat completion (for real-time responses)
   */
  async streamChatCompletion(
    messages: AIChatMessage[],
    onChunk: (chunk: string) => void,
    options?: {
      model?: string;
      temperature?: number;
      maxTokens?: number;
    }
  ) {
    try {
      const response = await this.client.post(
        '/chat/completions',
        {
          model: options?.model || openRouterConfig.defaultModel,
          messages,
          temperature: options?.temperature ?? openRouterConfig.defaultParams.temperature,
          max_tokens: options?.maxTokens ?? openRouterConfig.defaultParams.max_tokens,
          stream: true,
        },
        {
          responseType: 'stream',
        }
      );

      return new Promise((resolve, reject) => {
        let fullContent = '';
        let tokensUsed = 0;

        response.data.on('data', (chunk: Buffer) => {
          const lines = chunk.toString().split('\n').filter((line) => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                resolve({ content: fullContent, tokensUsed });
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices[0]?.delta?.content;

                if (delta) {
                  fullContent += delta;
                  onChunk(delta);
                }

                if (parsed.usage) {
                  tokensUsed = parsed.usage.total_tokens;
                }
              } catch (e) {
                // Ignore parsing errors for partial data
              }
            }
          }
        });

        response.data.on('error', (error: Error) => {
          reject(error);
        });

        response.data.on('end', () => {
          resolve({ content: fullContent, tokensUsed });
        });
      });
    } catch (error: any) {
      logger.error('OpenRouter streaming error', {
        error: error.message,
      });

      throw new Error(`OpenRouter streaming failed: ${error.message}`);
    }
  }

  /**
   * Calculate token cost
   */
  calculateCost(model: string, tokensUsed: number): number {
    const costs = openRouterConfig.tokenCosts[model as keyof typeof openRouterConfig.tokenCosts];

    if (!costs) {
      // Default cost if model not found
      return tokensUsed * 0.001;
    }

    // Rough estimation: assume 75% input, 25% output
    const inputTokens = Math.floor(tokensUsed * 0.75);
    const outputTokens = tokensUsed - inputTokens;

    const inputCost = (inputTokens / 1000) * costs.input;
    const outputCost = (outputTokens / 1000) * costs.output;

    return inputCost + outputCost;
  }

  /**
   * Get available models
   */
  async getModels() {
    try {
      const response = await this.client.get('/models');
      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch models', { error: error.message });
      throw new Error('Failed to fetch available models');
    }
  }
}

export const openRouterClient = new OpenRouterClientService();
