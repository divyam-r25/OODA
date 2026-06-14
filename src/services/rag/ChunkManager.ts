export interface Chunk {
  id: string;
  companyId: string;
  text: string;
  index: number;
  createdAt: string;
}

export class ChunkManager {
  /**
   * Split text into chunks aiming for roughly `targetTokens` each.
   * Assuming ~4 chars per token.
   */
  static splitText(companyId: string, text: string, targetTokens: number = 800): Chunk[] {
    const targetLength = targetTokens * 4;
    
    // Safety limit: Never process more than ~200KB of raw text to prevent SQLite crashes
    // and Out-Of-Memory errors in the React Native bridge.
    const safeText = text.substring(0, 200000);
    
    // First, split by paragraphs
    const paragraphs = safeText.split(/\n\s*\n/);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;

    for (const p of paragraphs) {
      let paragraph = p.trim();
      if (!paragraph) continue;

      // Force split massive paragraphs that lack double newlines
      while (paragraph.length > targetLength) {
        const slice = paragraph.substring(0, targetLength);
        chunks.push({
          id: `${companyId}-chunk-${chunkIndex}`,
          companyId,
          text: slice.trim(),
          index: chunkIndex,
          createdAt: new Date().toISOString()
        });
        chunkIndex++;
        paragraph = paragraph.substring(targetLength);
      }

      if (currentChunk.length + paragraph.length > targetLength && currentChunk.length > 0) {
        // Push current chunk and start a new one
        chunks.push({
          id: `${companyId}-chunk-${chunkIndex}`,
          companyId,
          text: currentChunk.trim(),
          index: chunkIndex,
          createdAt: new Date().toISOString()
        });
        currentChunk = paragraph + '\n\n';
        chunkIndex++;
      } else {
        currentChunk += paragraph + '\n\n';
      }
      
      // Hard cap chunks to prevent AsyncStorage SQLite limit (approx 2MB limit on Android)
      if (chunks.length > 50) break;
    }

    if (currentChunk.trim().length > 0 && chunks.length <= 50) {
      chunks.push({
        id: `${companyId}-chunk-${chunkIndex}`,
        companyId,
        text: currentChunk.trim(),
        index: chunkIndex,
        createdAt: new Date().toISOString()
      });
    }

    return chunks;
  }
}
