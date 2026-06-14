import type { DiscussionMessage } from '@/constants/agentData';
import type { AIProvider } from '../ai/AIProvider';
import type { DiscussionMemory } from './DiscussionMemory';
import { buildSystemPrompt } from '@/prompts/system';

export interface ReviewerOptions {
  provider: AIProvider;
  model: string;
  temperature: number;
}

export class Reviewer {
  constructor(private options: ReviewerOptions) {}

  /**
   * Executes the reviewer logic after discussion rounds are complete.
   */
  async runReview(
    memory: DiscussionMemory,
    companyContext: string,
    abortSignal?: AbortSignal
  ): Promise<DiscussionMessage> {
    const transcript = memory.getTranscript();

    // Build the system prompt for Reviewer
    const systemPrompt = buildSystemPrompt('reviewer', companyContext);

    const userPrompt = `The original signal was:\n${memory.signal}\n\nHere is the full discussion transcript:\n${transcript}\n\nProvide your final executive verdict.`;

    // Generate response
    const result = await this.options.provider.generate({
      model: this.options.model,
      systemPrompt,
      userPrompt,
      temperature: this.options.temperature,
      signal: abortSignal,
    });

    return this.parseResponse(result.text);
  }

  private parseResponse(rawText: string): DiscussionMessage {
    let content = rawText.trim();
    let confidence: number | undefined;

    const confidenceRegex = /CONFIDENCE:\s*(\\d{1,3})/i;
    const match = content.match(confidenceRegex);
    
    if (match) {
      confidence = parseInt(match[1], 10);
      content = content.replace(confidenceRegex, '').trim();
    }

    return {
      id: `reviewer-final-${Date.now()}`,
      agentId: 'reviewer',
      round: 0,
      content,
      confidence,
    };
  }
}
