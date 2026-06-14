import type { AIProvider, GenerateOptions, GenerateResult } from './AIProvider';
import { Config } from '@/config/constants';

export class OllamaProvider implements AIProvider {
  constructor(private baseUrl: string) {}

  async generate(options: GenerateOptions): Promise<GenerateResult> {
    const endpoint = `${this.baseUrl.replace(/\/$/, '')}${Config.GENERATE_ENDPOINT}`;

    const body = {
      model: options.model,
      system: options.systemPrompt,
      prompt: options.userPrompt,
      stream: false,
      options: {
        temperature: options.temperature ?? 0.7,
      },
    };

    const controller = new AbortController();
    // 1-minute hard timeout per agent as requested
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    console.log(`[OllamaProvider] Sending POST request to ${endpoint}`);
    console.log(`[OllamaProvider] Model: ${options.model}`);
    console.log(`[OllamaProvider] System Prompt length: ${options.systemPrompt.length} chars`);
    console.log(`[OllamaProvider] User Prompt length: ${options.userPrompt.length} chars`);
    console.log(`[OllamaProvider] Temperature: ${options.temperature ?? 0.7}`);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      
      console.log(`[OllamaProvider] Successfully received response from Ollama (${data.response.length} chars).`);

      return {
        text: data.response,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const message = err instanceof Error ? err.message : String(err);
      
      // Fail silently to prevent React Native Red Screen of Death
      console.warn(`[OllamaProvider] Connection/Generation failed: ${message}`);
      
      return {
        text: '{}' // Return empty JSON-like string so fallback parsers can handle it gracefully
      };
    }
  }
}
