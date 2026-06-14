

export enum PipelineState {
  IDLE = 'IDLE',
  SCRAPING = 'SCRAPING',
  CHUNKING = 'CHUNKING',
  INDEXING = 'INDEXING',
  RETRIEVING = 'RETRIEVING',
  ANALYZING = 'ANALYZING',
  GENERATING_REPORT = 'GENERATING_REPORT',
  SAVING = 'SAVING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export interface PipelineDebugStats {
  companyName: string;
  responseSizeKB: number;
  chunksCreated: number;
  chunksRetrieved: number;
  tokensSent: number;
  processingTimeSec: number;
}

class PipelineStoreImpl {
  status: PipelineState = PipelineState.IDLE;
  message: string = '';
  debugStats: PipelineDebugStats | null = null;
  private listeners: Set<() => void> = new Set();

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  setStatus(status: PipelineState, message?: string) {
    this.status = status;
    if (message !== undefined) this.message = message;
    this.notify();
  }

  setDebugStats(stats: PipelineDebugStats) {
    this.debugStats = stats;
    this.notify();
  }

  reset() {
    this.status = PipelineState.IDLE;
    this.message = '';
    this.debugStats = null;
    this.notify();
  }

  getState() {
    return {
      status: this.status,
      message: this.message,
      debugStats: this.debugStats,
      setStatus: this.setStatus.bind(this),
      setDebugStats: this.setDebugStats.bind(this),
      reset: this.reset.bind(this)
    };
  }
}

export const usePipelineStore = new PipelineStoreImpl();

import { useState, useEffect } from 'react';

export function usePipelineStoreState() {
  const [state, setState] = useState(usePipelineStore.getState());

  useEffect(() => {
    return usePipelineStore.subscribe(() => {
      setState(usePipelineStore.getState());
    });
  }, []);

  return state;
}
