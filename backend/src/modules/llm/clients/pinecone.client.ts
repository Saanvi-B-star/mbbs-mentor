/**
 * Pinecone Client
 * Singleton client for vector database operations
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { config } from '@/config';

/**
 * Pinecone client instance
 */
const pinecone = new Pinecone({
  apiKey: config.pinecone.apiKey,
});

/**
 * Get the MBBS index
 * Index name configured via environment
 */
const getPineconeIndex = () => {
  return pinecone.index(config.pinecone.indexName);
};

export { pinecone, getPineconeIndex };
