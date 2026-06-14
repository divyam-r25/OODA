import type { AgentRole, DiscussionMessage, DiscussionStatus } from '@/constants/agentData';
import { loadExecutionConfig, type ExecutionConfig } from '../modelService';
import { ProviderFactory } from '../ai/ProviderFactory';
import { DiscussionMemory } from './DiscussionMemory';
import { AgentRunner } from './AgentRunner';
import { Reviewer } from './Reviewer';
import { Config } from '@/config/constants';

export type ExecutionState = DiscussionStatus | 'failed';

export interface ExecutionEvent {
  state: ExecutionState;
  messages: DiscussionMessage[];
  error?: string;
}

export type ExecutionListener = (event: ExecutionEvent) => void;

export class ExecutionEngine {
  private state: ExecutionState = 'idle';
  private memory!: DiscussionMemory;
  private abortController: AbortController | null = null;
  private listeners: Set<ExecutionListener> = new Set();
  
  // Dummy company context for now, this would normally be loaded from CompanyContext
  private companyContext = "You are advising a SaaS startup targeting SMBs.";

  /**
   * Subscribe to state and message updates.
   */
  subscribe(listener: ExecutionListener): () => void {
    this.listeners.add(listener);
    // Emit current state immediately
    listener(this.getSnapshot());
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const event = this.getSnapshot();
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private getSnapshot(): ExecutionEvent {
    return {
      state: this.state,
      messages: this.memory ? [...this.memory.messages] : [],
    };
  }

  private setState(newState: ExecutionState) {
    this.state = newState;
    this.emit();
  }

  /**
   * Abort any running execution
   */
  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.setState('idle');
    }
  }

  /**
   * Starts the execution pipeline for a given signal.
   */
  async run(signalText: string, signalObj?: import('@/types').Signal) {
    this.abort();
    this.abortController = new AbortController();
    const abortSignal = this.abortController.signal;

    try {
      if (Config.DEBUG) {
        console.log('[ExecutionEngine] Starting execution pipeline for signal:', signalText.substring(0, 50) + '...');
      }
      this.memory = new DiscussionMemory(signalText);
      const config = await loadExecutionConfig();

      if (config.executionMode === 'single_agent') {
        await this.runSingleAgent(config, abortSignal);
      } else {
        await this.runMultiAgent(config, abortSignal, signalObj);
      }
    } catch (err: unknown) {
      if (abortSignal.aborted) {
        if (Config.DEBUG) console.log('[ExecutionEngine] Execution cancelled by user.');
        return;
      }
      if (Config.DEBUG) console.error('[ExecutionEngine] Error:', err);
      this.state = 'failed';
      // Notify listeners of the error
      for (const listener of this.listeners) {
        listener({
          state: 'failed',
          messages: this.memory ? [...this.memory.messages] : [],
          error: err instanceof Error ? err.message : String(err),
        });
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Runs the single agent flow (direct response, no discussion rounds)
   */
  private async runSingleAgent(config: ExecutionConfig, abortSignal: AbortSignal) {
    this.setState('round1'); // Using round1 state to indicate running

    const provider = ProviderFactory.getProvider(config.defaultModel, config.ollamaUrl, config.cloudConfig);
    
    const runner = new AgentRunner({
      agentId: 'strategy', // Fallback role for single agent
      model: config.defaultModel,
      provider,
      temperature: 0.7,
    });

    const msg = await runner.runRound(1, this.memory, this.companyContext, abortSignal);
    
    this.memory.append(msg);
    this.setState('done');
  }

  /**
   * Runs the full multi-agent discussion pipeline
   */
  private async runMultiAgent(config: ExecutionConfig, abortSignal: AbortSignal, signalObj?: import('@/types').Signal) {
    if (config.enabledAgents.length === 0) {
      throw new Error('No active agents configured for multi-agent mode.');
    }

    // Truncate to MAX_ACTIVE_AGENTS if necessary
    const agentsToRun = config.enabledAgents.slice(0, Config.MAX_ACTIVE_AGENTS);

    // 1. Setup runners for enabled agents
    const runners = agentsToRun.map((agentId) => {
      const assignedModel = config.agentModelMap[agentId] || config.defaultModel;
      const provider = ProviderFactory.getProvider(assignedModel, config.ollamaUrl, config.cloudConfig);
      
      return new AgentRunner({
        agentId,
        model: assignedModel,
        provider,
        temperature: 0.7, // Could be per-agent in the future
      });
    });

    // 2. Round 1: All agents think independently
    this.setState('round1');
    const r1Promises = runners.map(async (runner) => {
      try {
        const res = await runner.runRound(1, this.memory, this.companyContext, abortSignal);
        this.memory.append(res);
        this.emit(); // Update UI immediately so user sees agents pop in one by one
      } catch (err: any) {
        if (Config.DEBUG) console.warn(`[Engine] Agent failed in Round 1: ${err.message}`);
      }
    });
    
    await Promise.all(r1Promises);

    // 3. Round 2: Cross-review
    this.setState('round2');
    const r2Promises = runners.map(async (runner) => {
      try {
        const res = await runner.runRound(2, this.memory, this.companyContext, abortSignal);
        this.memory.append(res);
        this.emit();
      } catch (err: any) {
        if (Config.DEBUG) console.warn(`[Engine] Agent failed in Round 2: ${err.message}`);
      }
    });

    await Promise.all(r2Promises);

    // 4. Reviewer
    this.setState('reviewing');
    
    const reviewerProvider = ProviderFactory.getProvider(config.defaultModel, config.ollamaUrl, config.cloudConfig);
    const reviewer = new Reviewer({
      provider: reviewerProvider,
      model: config.defaultModel,
      temperature: 0.4, // Reviewer should be more deterministic
    });

    try {
      const verdict = await reviewer.runReview(this.memory, this.companyContext, abortSignal);
      this.memory.append(verdict);
      this.emit();

      // If we have a signal object, save the verdict to it
      if (signalObj && verdict.content) {
        signalObj.analysisVerdict = verdict.content;
        const { loadSignals, saveSignals } = await import('@/store/storage');
        const signals = await loadSignals();
        const index = signals.findIndex(s => s.id === signalObj.id);
        if (index >= 0) {
          signals[index] = signalObj;
          await saveSignals(signals);
        }
      }
    } catch (err) {
      if (Config.DEBUG) console.warn('[Engine] Reviewer failed:', err);
      // Even if reviewer fails, we might still want to mark as done and show discussion
    }

    this.setState('done');
  }
}

// Export a singleton instance
export const engine = new ExecutionEngine();
