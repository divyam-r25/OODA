// ─────────────────────────────────────────────
// OODA — Model Service
// Ollama live fetch + mock service methods.
// Replace mock returns with real API calls later.
// ─────────────────────────────────────────────

import type { AgentRole, ExecutionMode } from '@/constants/agentData';
import type { CloudConfig } from '@/store/storage';
import {
  loadActiveModels,
  loadAgentModelMap,
  loadCloudConfig,
  loadDefaultModel,
  loadEnabledAgents,
  loadExecutionMode,
  loadManualSignal,
  loadOllamaUrl,
  saveActiveModels,
  saveAgentModelMap,
  saveCloudConfig,
  saveDefaultModel,
  saveEnabledAgents,
  saveExecutionMode,
  saveManualSignal,
  saveOllamaUrl,
} from '@/store/storage';
import { Config } from '@/config/constants';

// ── Ollama Model Shape ─────────────────────────
export interface OllamaModel {
  name: string;
  modified_at?: string;
  size?: number;
  digest?: string;
  details?: {
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

export type OllamaStatus =
  | 'checking'
  | 'connected'    // Ollama running, models found
  | 'no_models'    // Ollama running but 0 models installed
  | 'not_found';   // Ollama not reachable

export interface OllamaResult {
  status: OllamaStatus;
  models: OllamaModel[];
  error?: string;
}

// ── Fetch from Ollama ─────────────────────────
export async function getAvailableModels(baseUrl?: string): Promise<OllamaResult> {
  const url = baseUrl ?? (await loadOllamaUrl());
  const endpoint = `${url.replace(/\/$/, '')}${Config.TAGS_ENDPOINT}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Config.DEFAULT_TIMEOUT);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { status: 'not_found', models: [], error: `HTTP ${response.status}` };
    }

    const data = await response.json();
    const models: OllamaModel[] = data.models ?? [];

    return {
      status: models.length === 0 ? 'no_models' : 'connected',
      models,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const isTimeout = message.includes('abort') || message.includes('timeout');
    return {
      status: 'not_found',
      models: [],
      error: isTimeout ? 'Connection timed out' : message,
    };
  }
}

// ── Agent Configuration ────────────────────────
export interface AgentSetting {
  id: AgentRole;
  enabled: boolean;
  assignedModel: string;
  temperature: number;
}

// ── Execution Config (full snapshot) ──────────
export interface ExecutionConfig {
  ollamaUrl: string;
  activeModels: string[];
  defaultModel: string;
  executionMode: ExecutionMode;
  enabledAgents: AgentRole[];
  agentModelMap: Record<string, string>;
  manualSignal: string;
  cloudConfig: CloudConfig;
}

// ── Load full config from storage ─────────────
export async function loadExecutionConfig(): Promise<ExecutionConfig> {
  const [
    ollamaUrl,
    activeModels,
    defaultModel,
    executionMode,
    enabledAgents,
    agentModelMap,
    manualSignal,
    cloudConfig,
  ] = await Promise.all([
    loadOllamaUrl(),
    loadActiveModels(),
    loadDefaultModel(),
    loadExecutionMode(),
    loadEnabledAgents(),
    loadAgentModelMap(),
    loadManualSignal(),
    loadCloudConfig(),
  ]);

  return {
    ollamaUrl,
    activeModels,
    defaultModel,
    executionMode,
    enabledAgents,
    agentModelMap,
    manualSignal,
    cloudConfig,
  };
}

// ── Save helpers (individually) ───────────────
export async function saveOllamaUrlSvc(url: string): Promise<void> {
  await saveOllamaUrl(url);
}

export async function saveSelectedModels(models: string[]): Promise<void> {
  await saveActiveModels(models);
}

export async function saveDefaultModelSvc(model: string): Promise<void> {
  await saveDefaultModel(model);
}

export async function saveExecutionModeSvc(mode: ExecutionMode): Promise<void> {
  await saveExecutionMode(mode);
}

export async function saveAgentConfigurationSvc(
  agents: AgentRole[],
  modelMap: Record<string, string>
): Promise<void> {
  await Promise.all([
    saveEnabledAgents(agents),
    saveAgentModelMap(modelMap),
  ]);
}

export async function saveCloudConfigSvc(config: CloudConfig): Promise<void> {
  await saveCloudConfig(config);
}

// ── Manual Signal ─────────────────────────────
export async function submitManualSignal(text: string): Promise<void> {
  // Persists the draft signal for later pipeline pickup
  await saveManualSignal(text);
  console.log('[OODA Signal] Manual signal queued:', text);
  // TODO Phase 3: enqueue to multi-agent execution pipeline
}

export async function clearManualSignal(): Promise<void> {
  await saveManualSignal('');
}

// ── Get Agents (mock) ─────────────────────────
export async function getAgents(): Promise<AgentRole[]> {
  // Future: fetch available agent types from backend
  return ['marketing', 'product', 'sales', 'strategy'] as AgentRole[];
}
