/**
 * Cohere Client
 * Singleton client for embedding operations
 */

import { CohereClient } from 'cohere-ai';
import { config } from '@/config';

let cohereClient: CohereClient | null = null;

if (config.cohere.apiKey) {
  cohereClient = new CohereClient({
    token: config.cohere.apiKey,
  });
}

export { cohereClient };
