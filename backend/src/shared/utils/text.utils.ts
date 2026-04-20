/**
 * Text utility functions for processing and chunking
 */

/**
 * Split text into chunks for embedding
 * @param text - Input text to chunk
 * @param maxChunkSize - Maximum number of characters per chunk
 * @param overlap - Number of characters to overlap between chunks
 * @returns Array of text chunks
 */
export const chunkText = async (
  text: string,
  maxChunkSize: number = 1000,
  overlap: number = 200
): Promise<string[]> => {
  if (!text) return [];

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;

    // If we're not at the end of the text, try to find a natural break point
    if (endIndex < text.length) {
      // Look for last newline or space within the last 20% of the chunk
      const searchWindow = text.substring(startIndex + Math.floor(maxChunkSize * 0.8), endIndex);
      const lastNewline = searchWindow.lastIndexOf('\n');
      const lastSpace = searchWindow.lastIndexOf(' ');

      if (lastNewline !== -1) {
        endIndex = startIndex + Math.floor(maxChunkSize * 0.8) + lastNewline;
      } else if (lastSpace !== -1) {
        endIndex = startIndex + Math.floor(maxChunkSize * 0.8) + lastSpace;
      }
    }

    const chunk = text.substring(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    // Move start index for next chunk, accounting for overlap
    startIndex = endIndex - overlap;

    // Safety check to prevent infinite loops
    if (startIndex >= endIndex) {
      startIndex = endIndex;
    }
    
    // If remaining text is too small, just break
    if (text.length - startIndex < 10) break;
  }

  return chunks;
};

/**
 * Estimate token count (rough estimation: 1 token ≈ 4 characters)
 * @param text - Input text
 * @returns Estimated token count
 */
export const estimateTokenCount = (text: string): number => {
  return Math.ceil(text.length / 4);
};
