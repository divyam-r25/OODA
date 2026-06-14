import type { AIProvider } from './AIProvider';
import { OllamaProvider } from './OllamaProvider';
import { CloudProvider } from './CloudProvider';
import type { CloudConfig } from '@/store/storage';

export class ProviderFactory {
  /**
   * Returns the appropriate AI provider instance.
   * If the model name matches the cloud config, it returns CloudProvider.
   * Otherwise, it defaults to Ollama.
   */
  static getProvider(
    model: string,
    ollamaUrl: string,
    cloudConfig: CloudConfig
  ): AIProvider {
    // Basic heuristic: if the selected model explicitly matches the cloud model name,
    // and cloud is configured, use the cloud provider.
    if (cloudConfig.modelName && model === cloudConfig.modelName) {
      return new CloudProvider(cloudConfig);
    }

    return new OllamaProvider(ollamaUrl);
  }
}
