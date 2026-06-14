import { Config } from '@/config/constants';

export interface ScrapeResult {
  url: string;
  success: boolean;
  markdown: string;
  error?: string;
}

export class ScraperService {
  /**
   * Scrapes a single URL with exponential backoff retries.
   */
  static async scrapeUrl(url: string, retries = 2): Promise<ScrapeResult> {
    const endpoint = `${Config.SCRAPER_BASE_URL.replace(/\/$/, '')}${Config.SCRAPER_ENDPOINT}`;
    
    let delay = 1000;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), Config.REQUEST_TIMEOUT);

        console.log(`[ScraperService] Attempt ${attempt + 1}/${retries + 1} - Sending POST request to ${endpoint}`);
        console.log(`[ScraperService] Payload: {"url": "${url}"}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[ScraperService] Scraper API returned HTTP ${response.status}`);
          throw new Error(`Scraper API returned HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(`[ScraperService] Request successful! Received valid JSON payload from scraper.`);
        
        return {
          url,
          success: true,
          markdown: data.markdown || JSON.stringify(data),
        };
      } catch (err: unknown) {
        const isLastAttempt = attempt === retries;
        
        if (isLastAttempt) {
          const message = err instanceof Error ? err.message : String(err);
          const errorMsg = message.includes('abort') ? 'Request timed out' : message;
          return {
            url,
            success: false,
            markdown: '',
            error: errorMsg,
          };
        }

        // Wait before retrying (exponential backoff: 1s, 2s, 4s...)
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    return { url, success: false, markdown: '', error: 'Unknown retry failure' };
  }

  /**
   * Scrapes multiple URLs in parallel.
   */
  static async scrapeMultiple(urls: string[]): Promise<ScrapeResult[]> {
    if (urls.length === 0) return [];

    // Promise.all to fetch them simultaneously
    return await Promise.all(urls.map((url) => this.scrapeUrl(url)));
  }
}
