import type { Chunk } from './ChunkManager';

export class RetrievalService {
  /**
   * Extremely lightweight local BM25/TF-IDF alternative using keyword overlap.
   */
  static retrieveTopChunks(chunks: Chunk[], queryKeywords: string[], maxChunks: number = 5): Chunk[] {
    if (chunks.length <= maxChunks) {
      return chunks; // No need to filter if we're under the limit
    }

    const scoredChunks = chunks.map(chunk => {
      let score = 0;
      const lowerText = chunk.text.toLowerCase();
      
      for (const keyword of queryKeywords) {
        // Count occurrences of keyword
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
          score += matches.length;
        }
      }

      return { chunk, score };
    });

    // Sort by score descending
    scoredChunks.sort((a, b) => b.score - a.score);

    // If scores are 0, it will just return the top `maxChunks` original chunks which is fine for fallback.
    return scoredChunks.slice(0, maxChunks).map(sc => sc.chunk);
  }
}
