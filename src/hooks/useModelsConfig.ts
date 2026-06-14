// ─────────────────────────────────────────────
// OODA — useModelsConfig Hook
// Single source of truth for all AI config state.
// Persists to AsyncStorage through modelService.
// ─────────────────────────────────────────────

import { useCallback, useEffect, useRef, useState } from 'react';

import type { AgentRole, ExecutionMode } from '@/constants/agentData';
import {
  type CloudConfig,
} from '@/store/storage';
import {
  clearManualSignal,
  getAvailableModels,
  loadExecutionConfig,
  type OllamaModel,
  type OllamaStatus,
  saveAgentConfigurationSvc,
  saveCloudConfigSvc,
  saveDefaultModelSvc,
  saveExecutionModeSvc,
  saveOllamaUrlSvc,
  saveSelectedModels,
  submitManualSignal,
} from '@/services/modelService';

const MAX_AGENTS = 4;

export interface ModelsConfigState {
  // Ollama
  ollamaUrl: string;
  ollamaStatus: OllamaStatus;
  ollamaError?: string;
  availableModels: OllamaModel[];
  isCheckingOllama: boolean;
  // Selection
  activeModels: string[];
  defaultModel: string;
  // Execution
  executionMode: ExecutionMode;
  // Agents
  enabledAgents: AgentRole[];
  agentModelMap: Record<string, string>;
  // Cloud
  cloudConfig: CloudConfig;
  // Signal
  manualSignal: string;
  // Loading
  isLoading: boolean;
}

export interface ModelsConfigActions {
  refreshOllama: () => Promise<void>;
  setOllamaUrl: (url: string) => void;
  saveOllamaUrl: () => Promise<void>;
  toggleModel: (name: string) => Promise<void>;
  setDefaultModel: (name: string) => Promise<void>;
  setExecutionMode: (mode: ExecutionMode) => Promise<void>;
  toggleAgent: (id: AgentRole) => Promise<void>;
  setAgentModel: (agentId: AgentRole, modelName: string) => Promise<void>;
  setCloudConfig: (config: CloudConfig) => Promise<void>;
  setManualSignal: (text: string) => void;
  submitSignal: () => Promise<void>;
  clearSignal: () => Promise<void>;
}

export function useModelsConfig(): ModelsConfigState & ModelsConfigActions {
  const [state, setState] = useState<ModelsConfigState>({
    ollamaUrl: 'http://10.0.2.2:11434',
    ollamaStatus: 'checking',
    ollamaError: undefined,
    availableModels: [],
    isCheckingOllama: false,
    activeModels: [],
    defaultModel: '',
    executionMode: 'multi_agent',
    enabledAgents: ['marketing', 'product', 'sales', 'strategy'],
    agentModelMap: {},
    cloudConfig: { provider: '', apiUrl: '', apiKey: '', modelName: '' },
    manualSignal: '',
    isLoading: true,
  });

  const signalDraftRef = useRef('');

  // ── Load from storage on mount ─────────────
  useEffect(() => {
    loadExecutionConfig().then((cfg) => {
      signalDraftRef.current = cfg.manualSignal;
      setState((prev) => ({
        ...prev,
        ollamaUrl: cfg.ollamaUrl,
        activeModels: cfg.activeModels,
        defaultModel: cfg.defaultModel,
        executionMode: cfg.executionMode,
        enabledAgents: cfg.enabledAgents,
        agentModelMap: cfg.agentModelMap,
        cloudConfig: cfg.cloudConfig,
        manualSignal: cfg.manualSignal,
        isLoading: false,
      }));
    });
  }, []);

  // ── Ollama refresh ─────────────────────────
  const refreshOllama = useCallback(async () => {
    setState((prev) => ({ ...prev, isCheckingOllama: true, ollamaStatus: 'checking' }));
    const result = await getAvailableModels(state.ollamaUrl);
    setState((prev) => ({
      ...prev,
      ollamaStatus: result.status,
      ollamaError: result.error,
      availableModels: result.models,
      isCheckingOllama: false,
    }));
  }, [state.ollamaUrl]);

  // Auto-check on mount (after config loaded)
  const hasChecked = useRef(false);
  useEffect(() => {
    if (!state.isLoading && !hasChecked.current) {
      hasChecked.current = true;
      refreshOllama();
    }
  }, [state.isLoading]);

  // ── Ollama URL ─────────────────────────────
  const setOllamaUrl = useCallback((url: string) => {
    setState((prev) => ({ ...prev, ollamaUrl: url }));
  }, []);

  const saveOllamaUrlAction = useCallback(async () => {
    await saveOllamaUrlSvc(state.ollamaUrl);
    await refreshOllama();
  }, [state.ollamaUrl, refreshOllama]);

  // ── Active Models ──────────────────────────
  const toggleModel = useCallback(async (name: string) => {
    setState((prev) => {
      const next = prev.activeModels.includes(name)
        ? prev.activeModels.filter((m) => m !== name)
        : [...prev.activeModels, name];
      saveSelectedModels(next);

      // If the default model was deselected, clear it
      const newDefault = next.includes(prev.defaultModel) ? prev.defaultModel : (next[0] ?? '');
      if (newDefault !== prev.defaultModel) {
        saveDefaultModelSvc(newDefault);
      }
      return { ...prev, activeModels: next, defaultModel: newDefault };
    });
  }, []);

  // ── Default Model ──────────────────────────
  const setDefaultModel = useCallback(async (name: string) => {
    await saveDefaultModelSvc(name);
    setState((prev) => ({ ...prev, defaultModel: name }));
  }, []);

  // ── Execution Mode ─────────────────────────
  const setExecutionMode = useCallback(async (mode: ExecutionMode) => {
    await saveExecutionModeSvc(mode);
    setState((prev) => ({ ...prev, executionMode: mode }));
  }, []);

  // ── Agents ────────────────────────────────
  const toggleAgent = useCallback(async (id: AgentRole) => {
    setState((prev) => {
      const isEnabled = prev.enabledAgents.includes(id);
      if (!isEnabled && prev.enabledAgents.length >= MAX_AGENTS) return prev;
      const next = isEnabled
        ? prev.enabledAgents.filter((a) => a !== id)
        : [...prev.enabledAgents, id];
      saveAgentConfigurationSvc(next, prev.agentModelMap);
      return { ...prev, enabledAgents: next };
    });
  }, []);

  const setAgentModel = useCallback(async (agentId: AgentRole, modelName: string) => {
    setState((prev) => {
      const next = { ...prev.agentModelMap, [agentId]: modelName };
      saveAgentConfigurationSvc(prev.enabledAgents, next);
      return { ...prev, agentModelMap: next };
    });
  }, []);

  // ── Cloud Config ───────────────────────────
  const setCloudConfig = useCallback(async (config: CloudConfig) => {
    await saveCloudConfigSvc(config);
    setState((prev) => ({ ...prev, cloudConfig: config }));
  }, []);

  // ── Manual Signal ──────────────────────────
  const setManualSignal = useCallback((text: string) => {
    signalDraftRef.current = text;
    setState((prev) => ({ ...prev, manualSignal: text }));
  }, []);

  const submitSignal = useCallback(async () => {
    await submitManualSignal(state.manualSignal);
  }, [state.manualSignal]);

  const clearSignal = useCallback(async () => {
    await clearManualSignal();
    setState((prev) => ({ ...prev, manualSignal: '' }));
  }, []);

  return {
    ...state,
    refreshOllama,
    setOllamaUrl,
    saveOllamaUrl: saveOllamaUrlAction,
    toggleModel,
    setDefaultModel,
    setExecutionMode,
    toggleAgent,
    setAgentModel,
    setCloudConfig,
    setManualSignal,
    submitSignal,
    clearSignal,
  };
}
