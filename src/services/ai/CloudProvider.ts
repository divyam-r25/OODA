import type { AIProvider, GenerateOptions, GenerateResult } from './AIProvider';
import type { CloudConfig } from '@/store/storage';

export class CloudProvider implements AIProvider {
  constructor(private config: CloudConfig) {}

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    // Phase 1: Provide a graceful fallback/stub since cloud isn't fully wired yet.
    // In production, this would switch based on config.provider (OpenAI, Anthropic)
    
    if (!this.config.apiUrl || !this.config.apiKey) {
      throw new Error('Cloud provider not fully configured.');
    }

    console.log('[CloudProvider] Stub generate called for:', options.model);

    // Provide a mocked response for now
    await new Promise((resolve) => setTimeout(resolve, 1500));

    return {
      text: `[Cloud response stub for ${options.model}]: This is a simulated response since cloud providers are not fully wired in Phase 1.`,
    };
  }
}
