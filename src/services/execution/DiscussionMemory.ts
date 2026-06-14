import type { AgentRole, DiscussionMessage } from '@/constants/agentData';

export class DiscussionMemory {
  public messages: DiscussionMessage[] = [];

  constructor(public signal: string) {}

  /**
   * Append a new message to the memory
   */
  append(message: DiscussionMessage) {
    this.messages.push(message);
  }

  /**
   * Returns a formatted transcript of all messages so far,
   * grouped by round. Useful for feeding into the LLM prompt.
   */
  getTranscript(): string {
    if (this.messages.length === 0) return 'No messages yet.';

    // Group by round
    const rounds = new Map<number, DiscussionMessage[]>();
    for (const msg of this.messages) {
      if (!rounds.has(msg.round)) {
        rounds.set(msg.round, []);
      }
      rounds.get(msg.round)!.push(msg);
    }

    let transcript = '';
    
    // Output ordered by round
    const roundNumbers = Array.from(rounds.keys()).sort((a, b) => a - b);
    
    for (const r of roundNumbers) {
      if (r === 0) continue; // Reviewer verdict is 0, usually we don't feed it back
      transcript += `\n=== ROUND ${r} ===\n`;
      for (const msg of rounds.get(r)!) {
        const ref = msg.referencesAgent ? ` (responding to ${msg.referencesAgent})` : '';
        transcript += `[${msg.agentId.toUpperCase()}]${ref}: ${msg.content}\n`;
      }
    }

    return transcript.trim();
  }

  /**
   * Returns all messages from a specific agent
   */
  getMessagesByAgent(agentId: AgentRole | 'reviewer'): DiscussionMessage[] {
    return this.messages.filter(m => m.agentId === agentId);
  }
}
