import type { AgentRole, DiscussionMessage } from '@/constants/agentData';
import type { AIProvider } from '../ai/AIProvider';
import type { DiscussionMemory } from './DiscussionMemory';
import { buildSystemPrompt } from '@/prompts/system';

export interface AgentRunnerOptions {
  agentId: AgentRole;
  provider: AIProvider;
  model: string;
  temperature: number;
}

export class AgentRunner {
  constructor(private options: AgentRunnerOptions) {}

  /**
   * Executes a single round for this agent.
   * Extracts confidence score if present in the output.
   */
  async runRound(
    round: number,
    memory: DiscussionMemory,
    companyContext: string,
    abortSignal?: AbortSignal
  ): Promise<DiscussionMessage> {
    const transcript = memory.getTranscript();
    const isFirstRound = round === 1;

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(
      this.options.agentId,
      companyContext,
      isFirstRound ? undefined : transcript
    );

    const userPrompt = `The current signal is:\n${memory.signal}\n\nProvide your analysis.`;

    // Generate response from AI provider
    const result = await this.options.provider.generate({
      model: this.options.model,
      systemPrompt,
      userPrompt,
      temperature: this.options.temperature,
      signal: abortSignal,
    });

    return this.parseResponse(result.text, round);
  }

  /**
   * Parses the raw text from the LLM, extracting the CONFIDENCE score
   * and looking for any "responding to" markers.
   */
  private parseResponse(rawText: string, round: number): DiscussionMessage {
    let content = rawText.trim();
    let confidence: number | undefined;

    // Heuristics to guess if responding to someone (for visual UI)
    // E.g., if text starts with "I agree with Strategy"
    let referencesAgent: AgentRole | undefined;
    const lowerContent = content.toLowerCase();
    
    if (round > 1) {
      const roles: AgentRole[] = ['marketing', 'product', 'sales', 'strategy'];
      for (const role of roles) {
        if (role === this.options.agentId) continue;
        // Simple heuristic: if they mention another role early on
        if (lowerContent.substring(0, 150).includes(role)) {
          referencesAgent = role;
          break;
        }
      }
    }

    return {
      id: `${this.options.agentId}-r${round}-${Date.now()}`,
      agentId: this.options.agentId,
      round,
      content,
      confidence,
      referencesAgent,
    };
  }
}
