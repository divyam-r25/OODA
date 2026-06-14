import type { Report, ComparisonResult } from '@/types';
import { ProviderFactory } from './ai/ProviderFactory';
import { loadExecutionConfig } from './modelService';

export class ComparisonService {
  /**
   * Compares an old report with a new report to detect changes.
   */
  static async compare(oldReport: Report, newReport: Report): Promise<ComparisonResult> {
    const config = await loadExecutionConfig();
    const provider = ProviderFactory.getProvider(config.defaultModel, config.ollamaUrl, config.cloudConfig);

    const systemPrompt = `
You are an expert Competitive Intelligence Analyst.
Your task is to compare two intelligence reports for the same competitor and identify any meaningful changes.

You MUST return ONLY valid JSON matching this structure:
{
  "changed": boolean,
  "changes": [
    {
      "category": "string (e.g. Pricing, Features, Messaging)",
      "description": "string (Brief explanation of what changed)",
      "previousValue": "string",
      "currentValue": "string",
      "severity": "low | medium | high | critical"
    }
  ]
}

If there are no meaningful changes, return {"changed": false, "changes": []}.
Ignore minor wording changes. Only flag strategic, pricing, or feature changes.
Do not include markdown blocks like \`\`\`json. Output pure JSON.
`;

    const userPrompt = `
OLD REPORT:
${JSON.stringify({
  pricing: oldReport.pricing,
  features: oldReport.features,
  messaging: oldReport.messaging,
  positioning: oldReport.positioning
}, null, 2)}

NEW REPORT:
${JSON.stringify({
  pricing: newReport.pricing,
  features: newReport.features,
  messaging: newReport.messaging,
  positioning: newReport.positioning
}, null, 2)}
`;

    try {
      const response = await provider.generate({
        model: config.defaultModel,
        systemPrompt,
        userPrompt,
        temperature: 0.1,
      });

      let cleanText = response.text.trim();
      if (cleanText.startsWith('\`\`\`json')) cleanText = cleanText.substring(7);
      if (cleanText.startsWith('\`\`\`')) cleanText = cleanText.substring(3);
      if (cleanText.endsWith('\`\`\`')) cleanText = cleanText.substring(0, cleanText.length - 3);
      cleanText = cleanText.trim();

      const parsed = JSON.parse(cleanText) as ComparisonResult;
      
      // Safety check
      if (!Array.isArray(parsed.changes)) parsed.changes = [];
      if (typeof parsed.changed !== 'boolean') parsed.changed = parsed.changes.length > 0;

      return parsed;
    } catch (err) {
      console.warn('[ComparisonService] Failed to compare reports:', err);
      // Fallback: assume no changes
      return { changed: false, changes: [] };
    }
  }
}
