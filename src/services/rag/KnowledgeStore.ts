import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Chunk } from './ChunkManager';

const STORE_PREFIX = 'ooda:knowledge_store:';

interface StoreEntry {
  hash: string;
  chunks: Chunk[];
}

export class KnowledgeStore {
  /**
   * Helper to compute a basic hash of a string to detect if it has changed.
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit int
    }
    return hash.toString();
  }

  /**
   * Check if the raw data for a company has changed.
   */
  static async hasDataChanged(companyId: string, rawData: string): Promise<boolean> {
    try {
      const key = `${STORE_PREFIX}${companyId}`;
      const entryStr = await AsyncStorage.getItem(key);
      if (!entryStr) return true;
      
      const entry: StoreEntry = JSON.parse(entryStr);
      return entry.hash !== this.hashString(rawData);
    } catch {
      return true;
    }
  }

  /**
   * Save chunks into local storage for a company.
   */
  static async saveChunks(companyId: string, rawData: string, chunks: Chunk[]): Promise<void> {
    try {
      const key = `${STORE_PREFIX}${companyId}`;
      const entry: StoreEntry = {
        hash: this.hashString(rawData),
        chunks,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
    } catch (err) {
      console.error(`[KnowledgeStore] Failed to save chunks for ${companyId}`, err);
    }
  }

  /**
   * Load chunks from local storage for a company.
   */
  static async loadChunks(companyId: string): Promise<Chunk[]> {
    try {
      const key = `${STORE_PREFIX}${companyId}`;
      const entryStr = await AsyncStorage.getItem(key);
      if (!entryStr) return [];
      
      const entry: StoreEntry = JSON.parse(entryStr);
      return entry.chunks || [];
    } catch {
      return [];
    }
  }
}
