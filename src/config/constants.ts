import { env } from './env';

const parseNumber = (val: string | undefined, fallback: number): number => {
  if (!val) return fallback;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? fallback : parsed;
};

const parseBoolean = (val: string | undefined, fallback: boolean): boolean => {
  if (!val) return fallback;
  return val.toLowerCase() === 'true' || val === '1';
};

export const Config = {
  OLLAMA_BASE_URL: env.EXPO_PUBLIC_OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
  GENERATE_ENDPOINT: env.EXPO_PUBLIC_OLLAMA_GENERATE_ENDPOINT || '/api/generate',
  TAGS_ENDPOINT: env.EXPO_PUBLIC_OLLAMA_TAGS_ENDPOINT || '/api/tags',
  
  DEFAULT_TIMEOUT: parseNumber(env.EXPO_PUBLIC_DEFAULT_TIMEOUT, 60000),
  DEFAULT_PROVIDER: env.EXPO_PUBLIC_DEFAULT_PROVIDER || 'ollama',
  
  DEBUG: parseBoolean(env.EXPO_PUBLIC_ENABLE_DEBUG, false),
  
  MAX_DISCUSSION_ROUNDS: parseNumber(env.EXPO_PUBLIC_MAX_DISCUSSION_ROUNDS, 2),
  MAX_ACTIVE_AGENTS: parseNumber(env.EXPO_PUBLIC_MAX_ACTIVE_AGENTS, 4),
  
  SCRAPER_BASE_URL: env.EXPO_PUBLIC_SCRAPER_BASE_URL || 'http://127.0.0.1:8000',
  SCRAPER_ENDPOINT: env.EXPO_PUBLIC_SCRAPER_ENDPOINT || '/api/web-scrapper',
  SCRAPER_INTERVAL_HOURS: parseNumber(env.EXPO_PUBLIC_SCRAPER_INTERVAL_HOURS, 12),
  ENABLE_AUTO_SCRAPER: parseBoolean(env.EXPO_PUBLIC_ENABLE_AUTO_SCRAPER, true),
  REQUEST_TIMEOUT: parseNumber(env.EXPO_PUBLIC_REQUEST_TIMEOUT, 120000),
} as const;

console.log(Config.SCRAPER_BASE_URL);
// Ensure required config exists (though defaults cover us above)
if (!Config.OLLAMA_BASE_URL) {
  console.warn('[Config] OLLAMA_BASE_URL is missing. Check .env');
}
