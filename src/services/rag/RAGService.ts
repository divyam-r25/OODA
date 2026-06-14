import { ChunkManager, type Chunk } from './ChunkManager';
import { KnowledgeStore } from './KnowledgeStore';
import { RetrievalService } from './RetrievalService';
import { PipelineState, usePipelineStore } from '@/store/PipelineStore';

export class RAGService {
  /**
   * Orchestrates the RAG flow for a raw scraped payload.
   * Returns the optimized context string to be sent to the LLM.
   */
  static async processAndRetrieve(companyName: string, companyId: string, rawData: string): Promise<string> {
    const store = usePipelineStore.getState();
    const startTime = Date.now();

    // 1. Check Cache
    const hasChanged = await KnowledgeStore.hasDataChanged(companyId, rawData);
    let chunks: Chunk[] = [];

    if (!hasChanged) {
      console.log(`[RAGService] Cache hit for ${companyId}. Scraped data has not changed since last scan.`);
      console.log(`[RAGService] Loading existing chunks from local knowledge store...`);
      store.setStatus(PipelineState.INDEXING, `Loading cached index for ${companyName}`);
      chunks = await KnowledgeStore.loadChunks(companyId);
      console.log(`[RAGService] Successfully loaded ${chunks.length} chunks from storage.`);
    } else {
      console.log(`[RAGService] Processing new data for ${companyId}. Data size: ${(rawData.length/1024).toFixed(2)} KB`);
      
      // 2. Chunking
      console.log(`[RAGService] Passing data to ChunkManager...`);
      store.setStatus(PipelineState.CHUNKING, `Chunking large response for ${companyName}`);
      chunks = ChunkManager.splitText(companyId, rawData, 800);
      console.log(`[RAGService] ChunkManager generated ${chunks.length} intelligent chunks (Target: 800 tokens per chunk).`);
      
      // 3. Indexing (Store)
      console.log(`[RAGService] Saving chunks to local KnowledgeStore...`);
      store.setStatus(PipelineState.INDEXING, `Saving ${chunks.length} chunks to local knowledge base`);
      await KnowledgeStore.saveChunks(companyId, rawData, chunks);
      console.log(`[RAGService] Chunks securely saved to KnowledgeStore.`);
    }

    // 4. Retrieving
    console.log(`[RAGService] Retrieving most relevant context out of ${chunks.length} chunks...`);
    store.setStatus(PipelineState.RETRIEVING, `Retrieving relevant context for baseline report`);
    // Base keywords for baseline report generation
    const baselineKeywords = ['pricing', 'features', 'positioning', 'audience', 'strengths', 'weaknesses', 'product', 'marketing', 'cost', 'plan'];
    
    // Target ~4000 tokens context (5 chunks * 800 tokens)
    const retrieved = RetrievalService.retrieveTopChunks(chunks, baselineKeywords, 5);
    console.log(`[RAGService] Retrieved ${retrieved.length} chunks successfully. Estimated context size: ~${retrieved.length * 800} tokens.`);
    
    // Combine context
    const context = retrieved.map((c) => `--- SECTION ${c.index} ---\n${c.text}\n`).join('\n');

    // 5. Update Debug Stats
    store.setDebugStats({
      companyName,
      responseSizeKB: parseFloat((rawData.length / 1024).toFixed(1)),
      chunksCreated: chunks.length,
      chunksRetrieved: retrieved.length,
      tokensSent: retrieved.length * 800, // Rough estimate
      processingTimeSec: parseFloat(((Date.now() - startTime) / 1000).toFixed(1))
    });

    return context;
  }
}
