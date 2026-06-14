export interface GenerateOptions {
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  signal?: AbortSignal; // For cancellation
}

export interface GenerateResult {
  text: string;
}

export interface AIProvider {
  generate(options: GenerateOptions): Promise<GenerateResult>;
}
