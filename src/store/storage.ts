// ─────────────────────────────────────────────
// OODA — Storage Layer
// All AsyncStorage interactions live here.
// Future backend sync: replace these functions.
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Competitor, CompanyProfile, OnboardingState } from '@/types';
import type { AgentRole, ExecutionMode } from '@/constants/agentData';
import { Config } from '@/config/constants';

// ── Keys ──────────────────────────────────────
export const KEYS = {
  AUTH: 'ooda:auth',
  COMPANY: 'ooda:company',
  COMPETITORS: 'ooda:competitors',
  ONBOARDING: 'ooda:onboarding',
  // AI Models config
  OLLAMA_URL: 'ooda:ollama_url',
  ACTIVE_MODELS: 'ooda:active_models',
  DEFAULT_MODEL: 'ooda:default_model',
  EXECUTION_MODE: 'ooda:execution_mode',
  ENABLED_AGENTS: 'ooda:enabled_agents',
  AGENT_MODEL_MAP: 'ooda:agent_model_map',
  MANUAL_SIGNAL: 'ooda:manual_signal',
  CLOUD_CONFIG: 'ooda:cloud_config',
  // Scraper config
  SCRAPER_LAST_RUN: 'ooda:scraper_last_run',
  SCRAPER_LAST_SUCCESS: 'ooda:scraper_last_success',
  SCRAPER_RESULTS: 'ooda:scraper_results',
  SCRAPER_FAILED_URLS: 'ooda:scraper_failed_urls',
  // Pipeline Data
  REPORTS: 'ooda:reports', // Record<companyId, Report>
  SIGNALS: 'ooda:signals', // Signal[]
  ACTIVITY_LOGS: 'ooda:activity_logs', // ActivityLog[]
} as const;

// ── Helpers ───────────────────────────────────
export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// ── Auth ──────────────────────────────────────
export async function saveAuthState(isAuthenticated: boolean): Promise<void> {
  await setJSON(KEYS.AUTH, { isAuthenticated });
}

export async function loadAuthState(): Promise<boolean> {
  const data = await getJSON<{ isAuthenticated: boolean }>(KEYS.AUTH);
  return data?.isAuthenticated ?? false;
}

export async function clearAuthState(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.AUTH);
}

// ── Company Profile ───────────────────────────
export async function saveCompanyProfile(profile: CompanyProfile): Promise<void> {
  await setJSON(KEYS.COMPANY, profile);
}

export async function loadCompanyProfile(): Promise<CompanyProfile | null> {
  return getJSON<CompanyProfile>(KEYS.COMPANY);
}

export async function clearCompanyProfile(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.COMPANY);
}

// ── Competitors ───────────────────────────────
export async function saveCompetitors(competitors: Competitor[]): Promise<void> {
  await setJSON(KEYS.COMPETITORS, competitors);
}

export async function loadCompetitors(): Promise<Competitor[]> {
  const data = await getJSON<Competitor[]>(KEYS.COMPETITORS);
  return data ?? [];
}

export async function clearCompetitors(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.COMPETITORS);
}

// ── Onboarding ────────────────────────────────
export async function saveOnboardingState(state: OnboardingState): Promise<void> {
  await setJSON(KEYS.ONBOARDING, state);
}

export async function loadOnboardingState(): Promise<OnboardingState> {
  const data = await getJSON<OnboardingState>(KEYS.ONBOARDING);
  return data ?? { completed: false, currentStep: 1 };
}

export async function clearOnboardingState(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.ONBOARDING);
}

// ── AI Models Config ──────────────────────────
export async function saveOllamaUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.OLLAMA_URL, url);
}

export async function loadOllamaUrl(): Promise<string> {
  const saved = await AsyncStorage.getItem(KEYS.OLLAMA_URL);
  return saved ?? Config.OLLAMA_BASE_URL;
}

export async function saveActiveModels(models: string[]): Promise<void> {
  await setJSON(KEYS.ACTIVE_MODELS, models);
}

export async function loadActiveModels(): Promise<string[]> {
  return (await getJSON<string[]>(KEYS.ACTIVE_MODELS)) ?? [];
}

export async function saveDefaultModel(model: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.DEFAULT_MODEL, model);
}

export async function loadDefaultModel(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.DEFAULT_MODEL)) ?? '';
}

export async function saveExecutionMode(mode: ExecutionMode): Promise<void> {
  await AsyncStorage.setItem(KEYS.EXECUTION_MODE, mode);
}

export async function loadExecutionMode(): Promise<ExecutionMode> {
  const val = await AsyncStorage.getItem(KEYS.EXECUTION_MODE);
  return (val as ExecutionMode) ?? 'multi_agent';
}

export async function saveEnabledAgents(agents: AgentRole[]): Promise<void> {
  await setJSON(KEYS.ENABLED_AGENTS, agents);
}

export async function loadEnabledAgents(): Promise<AgentRole[]> {
  const data = await getJSON<AgentRole[]>(KEYS.ENABLED_AGENTS);
  return data ?? ['marketing', 'product', 'sales', 'strategy'];
}

export async function saveAgentModelMap(map: Record<string, string>): Promise<void> {
  await setJSON(KEYS.AGENT_MODEL_MAP, map);
}

export async function loadAgentModelMap(): Promise<Record<string, string>> {
  return (await getJSON<Record<string, string>>(KEYS.AGENT_MODEL_MAP)) ?? {};
}

export async function saveManualSignal(text: string): Promise<void> {
  await AsyncStorage.setItem(KEYS.MANUAL_SIGNAL, text);
}

export async function loadManualSignal(): Promise<string> {
  return (await AsyncStorage.getItem(KEYS.MANUAL_SIGNAL)) ?? '';
}

export interface CloudConfig {
  provider: string;
  apiUrl: string;
  apiKey: string;
  modelName: string;
}

export async function saveCloudConfig(config: CloudConfig): Promise<void> {
  await setJSON(KEYS.CLOUD_CONFIG, config);
}

export async function loadCloudConfig(): Promise<CloudConfig> {
  const defaultCfg: CloudConfig = {
    provider: 'openai',
    apiKey: '',
    apiUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o',
  };
  return (await getJSON<CloudConfig>(KEYS.CLOUD_CONFIG)) ?? defaultCfg;
}

// ── Scraper ───────────────────────────────────

export async function saveScraperLastRun(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.SCRAPER_LAST_RUN, timestamp.toString());
}

export async function loadScraperLastRun(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.SCRAPER_LAST_RUN);
  return val ? parseInt(val, 10) : 0;
}

export async function saveScraperLastSuccess(timestamp: number): Promise<void> {
  await AsyncStorage.setItem(KEYS.SCRAPER_LAST_SUCCESS, timestamp.toString());
}

export async function loadScraperLastSuccess(): Promise<number> {
  const val = await AsyncStorage.getItem(KEYS.SCRAPER_LAST_SUCCESS);
  return val ? parseInt(val, 10) : 0;
}

export interface ScraperResultItem {
  url: string;
  data?: any;
}

export async function saveScraperResults(results: ScraperResultItem[]): Promise<void> {
  await setJSON(KEYS.SCRAPER_RESULTS, results);
}

export async function loadScraperResults(): Promise<ScraperResultItem[]> {
  return (await getJSON<ScraperResultItem[]>(KEYS.SCRAPER_RESULTS)) ?? [];
}

export async function setScraperFailedUrls(urls: string[]): Promise<void> {
  await setJSON(KEYS.SCRAPER_FAILED_URLS, urls);
}

// ── Pipeline Data (Reports, Signals, Activities) ──

import type { Report, Signal, ActivityLog } from '@/types';

// Reports
export async function saveReports(reports: Record<string, Report>): Promise<void> {
  await setJSON(KEYS.REPORTS, reports);
}

export async function loadReports(): Promise<Record<string, Report>> {
  const data = await getJSON<Record<string, Report>>(KEYS.REPORTS);
  return data ?? {};
}

// Signals
export async function saveSignals(signals: Signal[]): Promise<void> {
  await setJSON(KEYS.SIGNALS, signals);
}

export async function loadSignals(): Promise<Signal[]> {
  const data = await getJSON<Signal[]>(KEYS.SIGNALS);
  return data ?? [];
}

// Activity Logs
export async function saveActivityLogs(logs: ActivityLog[]): Promise<void> {
  await setJSON(KEYS.ACTIVITY_LOGS, logs);
}

export async function loadActivityLogs(): Promise<ActivityLog[]> {
  const data = await getJSON<ActivityLog[]>(KEYS.ACTIVITY_LOGS);
  return data ?? [];
}

export async function loadScraperFailedUrls(): Promise<string[]> {
  return (await getJSON<string[]>(KEYS.SCRAPER_FAILED_URLS)) ?? [];
}

// ── Wipe All ──────────────────────────────────
export async function wipeAllData(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
