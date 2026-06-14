import type { Report } from '@/types';
import { ProviderFactory } from './ai/ProviderFactory';
import { loadExecutionConfig } from './modelService';

export class ReportService {
  /**
   * Analyzes raw scraped data to generate a structured baseline report.
   */
  static async generateReport(companyId: string, sourceUrl: string, retrievedContext: string): Promise<Report> {
    const config = await loadExecutionConfig();
    const provider = ProviderFactory.getProvider(config.defaultModel, config.ollamaUrl, config.cloudConfig);

    const systemPrompt = `
You are an expert Competitive Intelligence Analyst.
Your task is to analyze the provided retrieved context snippets from the company's website and extract key intelligence into a strict JSON format.

You MUST return ONLY valid JSON matching this structure:
{
  "summary": "Brief 2-3 sentence overview of the company/product",
  "pricing": "Details on pricing tiers, or 'Not publicly available'",
  "positioning": "How they position themselves (target audience, unique value prop)",
  "features": "List of core features",
  "messaging": "Key marketing slogans and tone",
  "strengths": "Main advantages observed",
  "weaknesses": "Missing features or weak points",
  "recommendations": "1-2 strategic recommendations based on this profile",
  "customData": {
    "Domain Specific Key 1": "Found detail...",
    "Domain Specific Key 2": "Found detail..."
  }
}

In the "customData" dictionary, extract 3 to 5 CUSTOM key-value pairs that are specifically highly relevant to this particular website (e.g., 'Course Duration', 'Tech Stack', 'Placement Guarantee', 'User Base Size', 'Delivery Method' depending on what is ACTUALLY in the text). Do not use generic keys for customData.

Do not include markdown blocks like \`\`\`json around the output. Output pure JSON.
`;

    const userPrompt = `Retrieved Context:\n\n${retrievedContext}`;

    try {
      const response = await provider.generate({
        model: config.defaultModel,
        systemPrompt,
        userPrompt,
        temperature: 0.1, // Low temperature for factual extraction
      });

      let cleanText = response.text.trim();
      // Heuristic to strip markdown if the model hallucinates it anyway
      if (cleanText.startsWith('\`\`\`json')) cleanText = cleanText.substring(7);
      if (cleanText.startsWith('\`\`\`')) cleanText = cleanText.substring(3);
      if (cleanText.endsWith('\`\`\`')) cleanText = cleanText.substring(0, cleanText.length - 3);
      cleanText = cleanText.trim();

      let parsed: any = {};
      try {
        parsed = JSON.parse(cleanText);
      } catch (parseErr) {
        console.warn('[ReportService] Standard JSON.parse failed. Attempting robust extraction...');
        // Try to extract a JSON object from the string using regex
        const match = cleanText.match(/\{[\s\S]*\}/);
        if (match) {
          try {
            parsed = JSON.parse(match[0]);
            console.log('[ReportService] Robust regex extraction succeeded.');
          } catch (e2) {
            console.warn('[ReportService] Regex extraction failed too. Falling back to raw text.');
            parsed.summary = cleanText.substring(0, 500) + '...'; // Dump text into summary
          }
        } else {
          parsed.summary = cleanText.substring(0, 500) + '...';
        }
      }

      // --- TARGETED FALLBACK FOR MISSING COMPARISON FIELDS ---
      // If the model missed critical fields, make specific targeted queries for each one.
      const criticalFields = ['pricing', 'features', 'positioning'];
      for (const field of criticalFields) {
        const val = parsed[field];
        if (!val || val === 'Unknown' || val.toLowerCase() === 'unknown' || val.length < 5) {
          console.log(`[ReportService] Field '${field}' is missing or Unknown. Triggering targeted fallback query...`);
          try {
            const fallbackResponse = await provider.generate({
              model: config.defaultModel,
              systemPrompt: `You are a precise data extractor. Read the text and extract the ${field}. Answer in 1 to 2 concise sentences. If the text does not contain this information, reply EXACTLY with "Not publicly available". Do not explain your reasoning.`,
              userPrompt: `Text:\n${retrievedContext}\n\nExtract the ${field}.`,
              temperature: 0.1,
            });
            parsed[field] = fallbackResponse.text.trim();
            console.log(`[ReportService] Fallback for ${field} succeeded.`);
          } catch (fallbackErr) {
            console.warn(`[ReportService] Fallback query for ${field} failed.`);
            parsed[field] = 'Not publicly available';
          }
        }
      }
      // -------------------------------------------------------

      const report: Report = {
        companyId,
        sourceUrl,
        generatedAt: new Date().toISOString(),
        summary: parsed.summary || 'Unknown',
        pricing: parsed.pricing || 'Unknown',
        positioning: parsed.positioning || 'Unknown',
        features: parsed.features || 'Unknown',
        messaging: parsed.messaging || 'Unknown',
        strengths: parsed.strengths || 'Unknown',
        weaknesses: parsed.weaknesses || 'Unknown',
        recommendations: parsed.recommendations || 'Unknown',
        rawScrapedData: retrievedContext, // Saving context instead of huge raw data
        customData: parsed.customData || {},
      };

      return report;
    } catch (err) {
      console.warn('[ReportService] Failed to generate report:', err);
      // Fallback stub report if generation fails
      return {
        companyId,
        sourceUrl,
        generatedAt: new Date().toISOString(),
        summary: 'Failed to analyze scraped data.',
        pricing: 'Unknown',
        positioning: 'Unknown',
        features: 'Unknown',
        messaging: 'Unknown',
        strengths: 'Unknown',
        weaknesses: 'Unknown',
        recommendations: 'Unknown',
        rawScrapedData: retrievedContext,
        customData: {},
      };
    }
  }
}
