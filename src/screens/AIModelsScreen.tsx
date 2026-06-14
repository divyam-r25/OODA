// ─────────────────────────────────────────────
// OODA — AI Models Screen
// Full AI configuration: Ollama, models, agents,
// cloud, manual signal, pipeline preview
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { AGENT_ROSTER, REVIEWER_AGENT, type AgentRole } from '@/constants/agentData';
import { useModelsConfig } from '@/hooks/useModelsConfig';
import type { CloudConfig } from '@/store/storage';

const MAX_AGENTS = 4;

// ── Section Header ────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <View style={sh.wrap}>
      <Text style={sh.title}>{title}</Text>
      {sub && <Text style={sh.sub}>{sub}</Text>}
    </View>
  );
}

const sh = StyleSheet.create({
  wrap: { gap: 3, marginBottom: 2 },
  title: { fontSize: 13, fontWeight: '700', color: OODA.textTertiary, textTransform: 'uppercase', letterSpacing: 0.9 },
  sub: { fontSize: 12, color: OODA.textMuted, lineHeight: 17 },
});

// ── Ollama Status Banner ──────────────────────
function OllamaStatusBanner({
  status,
  error,
  isChecking,
  url,
  onRefresh,
  onEditUrl,
}: {
  status: string;
  error?: string;
  isChecking: boolean;
  url: string;
  onRefresh: () => void;
  onEditUrl: () => void;
}) {
  const cfg = {
    checking: { bg: OODA.bgSurface, border: OODA.border, icon: null, title: 'Checking Ollama…', sub: url, color: OODA.textTertiary },
    connected: { bg: OODA.successBg, border: OODA.success, icon: <Ionicons name="checkmark" size={16} color={OODA.success} />, title: 'Ollama Connected', sub: url, color: OODA.success },
    no_models: { bg: OODA.warningBg, border: OODA.warning, icon: <Ionicons name="warning-outline" size={16} color={OODA.warning} />, title: 'No Models Installed', sub: 'Run: ollama pull llama3.2', color: OODA.warning },
    not_found: { bg: OODA.dangerBg, border: OODA.danger, icon: <Ionicons name="close" size={16} color={OODA.danger} />, title: 'Ollama Not Found', sub: error ?? 'Check if Ollama is running', color: OODA.danger },
  }[status] ?? { bg: OODA.bgSurface, border: OODA.border, icon: null, title: '', sub: '', color: OODA.textTertiary };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={[obs.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
      <View style={obs.row}>
        <View style={obs.left}>
          {isChecking ? (
            <ActivityIndicator size="small" color={OODA.primary} />
          ) : cfg.icon ? (
            <View style={obs.iconWrap}>{cfg.icon}</View>
          ) : (
            <ActivityIndicator size="small" color={OODA.textMuted} />
          )}
          <View style={obs.texts}>
            <Text style={[obs.title, { color: cfg.color }]}>{cfg.title}</Text>
            <Text style={obs.url} numberOfLines={1}>{cfg.sub}</Text>
          </View>
        </View>
        <View style={obs.actions}>
          <TouchableOpacity onPress={onEditUrl} style={obs.btn} activeOpacity={0.75}>
            <Text style={obs.btnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onRefresh} style={[obs.btn, obs.btnRefresh]} activeOpacity={0.75} disabled={isChecking}>
            <Text style={[obs.btnText, obs.btnRefreshText]}><Ionicons name="refresh" size={13} color={OODA.primaryDark} /> Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const obs = StyleSheet.create({
  card: { borderRadius: Radius.lg, borderWidth: 1.5, padding: 14, gap: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'space-between' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  iconWrap: { width: 20, alignItems: 'center', justifyContent: 'center' },
  texts: { flex: 1 },
  title: { fontSize: 13, fontWeight: '700' },
  url: { fontSize: 11, color: OODA.textMuted, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.pill, borderWidth: 1, borderColor: OODA.border, backgroundColor: OODA.card },
  btnText: { fontSize: 11, fontWeight: '600', color: OODA.textSecondary },
  btnRefresh: { backgroundColor: OODA.primaryGlow, borderColor: OODA.primaryGlowStrong },
  btnRefreshText: { color: OODA.primaryDark },
});

// ── URL Edit Modal (inline) ───────────────────
function OllamaUrlEditor({
  value,
  onChange,
  onSave,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(300).springify()} style={ue.card}>
      <Text style={ue.label}>Ollama Base URL</Text>
      <TextInput
        style={ue.input}
        value={value}
        onChangeText={onChange}
        placeholder="http://10.0.2.2:11434"
        placeholderTextColor={OODA.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
      />
      <Text style={ue.hint}>
        Android emulator: <Text style={{ fontWeight: '700' }}>10.0.2.2</Text> · iOS simulator / real device: <Text style={{ fontWeight: '700' }}>localhost</Text>
      </Text>
      <View style={ue.row}>
        <TouchableOpacity onPress={onCancel} style={ue.cancelBtn} activeOpacity={0.75}>
          <Text style={ue.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSave} style={ue.saveBtn} activeOpacity={0.85}>
          <Text style={ue.saveText}>Save & Refresh</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const ue = StyleSheet.create({
  card: { backgroundColor: OODA.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: OODA.border, padding: 16, gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: OODA.textSecondary },
  input: { backgroundColor: OODA.bgSurface, borderWidth: 1.5, borderColor: OODA.border, borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: OODA.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  hint: { fontSize: 11, color: OODA.textMuted, lineHeight: 17 },
  row: { flexDirection: 'row', gap: 10 },
  cancelBtn: { flex: 1, height: 44, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: OODA.border, justifyContent: 'center', alignItems: 'center' },
  cancelText: { fontSize: 14, fontWeight: '600', color: OODA.textSecondary },
  saveBtn: { flex: 2, height: 44, borderRadius: Radius.pill, backgroundColor: OODA.primary, justifyContent: 'center', alignItems: 'center' },
  saveText: { fontSize: 14, fontWeight: '700', color: OODA.textInverse },
});

// ── Model Checkbox Row ────────────────────────
function ModelRow({
  name,
  isActive,
  isDefault,
  family,
  size,
  onToggle,
  onSetDefault,
}: {
  name: string;
  isActive: boolean;
  isDefault: boolean;
  family?: string;
  size?: string;
  onToggle: () => void;
  onSetDefault: () => void;
}) {
  return (
    <View style={mr.row}>
      <TouchableOpacity onPress={onToggle} style={mr.checkWrap} activeOpacity={0.75}>
        <View style={[mr.checkbox, isActive && mr.checkboxActive]}>
          {isActive && <Ionicons name="checkmark" size={15} color={OODA.textInverse} />}
        </View>
      </TouchableOpacity>
      <View style={mr.info}>
        <Text style={mr.name} numberOfLines={1}>{name}</Text>
        {(family || size) && (
          <Text style={mr.meta}>{[family, size].filter(Boolean).join(' · ')}</Text>
        )}
      </View>
      {isActive && (
        <TouchableOpacity onPress={onSetDefault} activeOpacity={0.75}
          style={[mr.defaultBtn, isDefault && mr.defaultBtnActive]}
        >
          <Text style={[mr.defaultText, isDefault && mr.defaultTextActive]}>
            <Ionicons name={isDefault ? "radio-button-on" : "radio-button-off"} size={12} color={isDefault ? OODA.primaryDark : OODA.textTertiary} /> {isDefault ? 'Default' : 'Set Default'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const mr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: OODA.borderSubtle },
  checkWrap: { padding: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: OODA.border, justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: OODA.primary, borderColor: OODA.primary },
  checkmark: { fontSize: 13, fontWeight: '700', color: OODA.textInverse },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: OODA.textPrimary },
  meta: { fontSize: 11, color: OODA.textMuted, marginTop: 1 },
  defaultBtn: { borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: OODA.border },
  defaultBtnActive: { backgroundColor: OODA.primaryGlow, borderColor: OODA.primaryGlowStrong },
  defaultText: { fontSize: 11, fontWeight: '600', color: OODA.textTertiary },
  defaultTextActive: { color: OODA.primaryDark },
});

// ── Agent Config Card ─────────────────────────
function AgentConfigCard({
  agent,
  isEnabled,
  isDisabled,
  assignedModel,
  availableModels,
  onToggle,
  onModelChange,
}: {
  agent: typeof AGENT_ROSTER[0];
  isEnabled: boolean;
  isDisabled: boolean;
  assignedModel: string;
  availableModels: string[];
  onToggle: () => void;
  onModelChange: (model: string) => void;
}) {
  const [showModelPicker, setShowModelPicker] = useState(false);

  return (
    <View style={[ac.card, isEnabled && ac.cardActive, isDisabled && ac.cardDisabled]}>
      <View style={ac.header}>
        <View style={[ac.avatar, { backgroundColor: agent.avatarBg }]}>
          <Text style={ac.emoji}>{agent.emoji}</Text>
        </View>
        <View style={ac.info}>
          <Text style={ac.name}>{agent.name}</Text>
          <Text style={ac.focus} numberOfLines={1}>{agent.focus}</Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={(_v: boolean) => { if (!isDisabled || isEnabled) onToggle(); }}
          trackColor={{ false: OODA.border, true: OODA.primaryGlowStrong }}
          thumbColor={isEnabled ? OODA.primary : OODA.textMuted}
        />
      </View>

      {isEnabled && (
        <Animated.View entering={FadeInDown.duration(250).springify()} style={ac.config}>
          <TouchableOpacity
            onPress={() => setShowModelPicker(!showModelPicker)}
            style={ac.modelSelect}
            activeOpacity={0.8}
          >
            <Text style={ac.modelSelectLabel}>Model</Text>
            <Text style={ac.modelSelectValue} numberOfLines={1}>
              {assignedModel || (availableModels[0] ?? 'None available')}
            </Text>
            <Ionicons name="chevron-down" size={14} color={OODA.textMuted} />
          </TouchableOpacity>

          {showModelPicker && availableModels.length > 0 && (
            <Animated.View entering={FadeIn.duration(200)} style={ac.pickerMenu}>
              {availableModels.map((m) => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { onModelChange(m); setShowModelPicker(false); }}
                  style={[ac.pickerOption, (assignedModel || availableModels[0]) === m && ac.pickerOptionActive]}
                >
                  <Text style={ac.pickerOptionText} numberOfLines={1}>{m}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
          {showModelPicker && availableModels.length === 0 && (
            <Animated.View entering={FadeIn.duration(200)} style={ac.noModels}>
              <Text style={ac.noModelsText}>No Ollama models available. Add models or configure a cloud model.</Text>
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const ac = StyleSheet.create({
  card: { backgroundColor: OODA.card, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: OODA.border, padding: 14, gap: 0 },
  cardActive: { borderColor: OODA.primaryGlowStrong, backgroundColor: '#FAFFFA' },
  cardDisabled: { opacity: 0.4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  emoji: { fontSize: 18 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  focus: { fontSize: 11, color: OODA.textTertiary, marginTop: 1 },
  config: { gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: OODA.border },
  modelSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OODA.bgSurface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: OODA.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  modelSelectLabel: { fontSize: 11, fontWeight: '700', color: OODA.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, width: 40 },
  modelSelectValue: { flex: 1, fontSize: 13, fontWeight: '600', color: OODA.textPrimary },
  modelSelectArrow: { fontSize: 12, color: OODA.textMuted },
  pickerMenu: { backgroundColor: OODA.card, borderRadius: Radius.lg, borderWidth: 1, borderColor: OODA.border, overflow: 'hidden' },
  pickerOption: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: OODA.borderSubtle },
  pickerOptionActive: { backgroundColor: OODA.primaryGlow },
  pickerOptionText: { fontSize: 13, fontWeight: '600', color: OODA.textPrimary },
  noModels: { backgroundColor: OODA.warningBg, borderRadius: Radius.md, padding: 10 },
  noModelsText: { fontSize: 12, color: '#B45309', lineHeight: 17 },
});

// ── Pipeline Preview Diagram ──────────────────
function PipelinePreview({ mode, agents }: { mode: string; agents: typeof AGENT_ROSTER }) {
  const isSingle = mode === 'single_agent';

  return (
    <Animated.View key={mode} entering={FadeIn.duration(350)} style={pp.card}>
      <Text style={pp.title}>Execution Pipeline Preview</Text>

      <View style={pp.diagram}>
        {/* Signal */}
        <View style={pp.node}>
          <Text style={pp.nodeText}><Ionicons name="radio-outline" size={14} color={OODA.textSecondary} /> Signal</Text>
        </View>
        <Text style={pp.arrow}>↓</Text>

        {isSingle ? (
          <>
            <View style={[pp.node, pp.modelNode]}>
              <Text style={pp.nodeText}><Ionicons name="hardware-chip-outline" size={14} color={OODA.textSecondary} /> Default Model</Text>
            </View>
            <Text style={pp.arrow}>↓</Text>
            <View style={[pp.node, pp.resultNode]}>
              <Text style={pp.nodeText}><Ionicons name="document-text-outline" size={14} color={OODA.textSecondary} /> Response</Text>
            </View>
          </>
        ) : (
          <>
            <View style={pp.agentsGrid}>
              {agents.map((a) => (
                <View key={a.id} style={[pp.agentNode, { backgroundColor: a.avatarBg }]}>
                  <Text style={pp.agentNodeEmoji}>{a.emoji}</Text>
                  <Text style={[pp.agentNodeName, { color: a.avatarColor }]}>{a.shortName}</Text>
                </View>
              ))}
            </View>
            <Text style={pp.concurrentNote}><Ionicons name="flash" size={12} color={OODA.primaryDark} /> All agents run simultaneously</Text>
            <Text style={pp.arrow}>↓</Text>
            <View style={[pp.node, pp.discussionNode]}>
              <Text style={pp.nodeText}><Ionicons name="chatbubbles-outline" size={14} color={OODA.textSecondary} /> Multi-Round Discussion</Text>
            </View>
            <Text style={pp.arrow}>↓</Text>
            <View style={[pp.node, { backgroundColor: REVIEWER_AGENT.avatarBg }]}>
              <Text style={[pp.nodeText, { color: REVIEWER_AGENT.avatarColor }]}>
                {REVIEWER_AGENT.emoji} Reviewer
              </Text>
            </View>
            <Text style={pp.arrow}>↓</Text>
            <View style={[pp.node, pp.resultNode]}>
              <Text style={pp.nodeText}><Ionicons name="checkmark-circle-outline" size={14} color={OODA.textSecondary} /> Final Verdict</Text>
            </View>
          </>
        )}
      </View>

      <Text style={pp.philosophy}>
        {isSingle
          ? 'The default Ollama model receives the signal and returns a direct response.'
          : 'Every enabled agent receives the same signal at the same time. They independently form opinions, review each other\'s responses, discuss for multiple rounds, then the Reviewer synthesises everything into a single recommendation.'}
      </Text>
    </Animated.View>
  );
}

const pp = StyleSheet.create({
  card: { backgroundColor: OODA.card, borderRadius: Radius.xl, borderWidth: 1, borderColor: OODA.border, padding: 18, gap: 12 },
  title: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  diagram: { alignItems: 'center', gap: 6 },
  node: { backgroundColor: OODA.bgSurface, borderRadius: Radius.md, borderWidth: 1, borderColor: OODA.border, paddingHorizontal: 18, paddingVertical: 9 },
  nodeText: { fontSize: 13, fontWeight: '600', color: OODA.textSecondary },
  modelNode: { backgroundColor: OODA.secondaryGlow, borderColor: OODA.secondary },
  discussionNode: { backgroundColor: OODA.primaryGlow, borderColor: OODA.primaryGlowStrong },
  resultNode: { backgroundColor: OODA.successBg, borderColor: OODA.success },
  arrow: { fontSize: 16, color: OODA.textMuted },
  agentsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  agentNode: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 3 },
  agentNodeEmoji: { fontSize: 16 },
  agentNodeName: { fontSize: 11, fontWeight: '700' },
  concurrentNote: { fontSize: 11, fontWeight: '700', color: OODA.primaryDark },
  philosophy: { fontSize: 12, color: OODA.textTertiary, lineHeight: 19, fontStyle: 'italic' },
});

// ─────────────────────────────────────────────
// AI MODELS SCREEN
// ─────────────────────────────────────────────
interface AIModelsScreenProps {
  onBack: () => void;
}

export function AIModelsScreen({ onBack }: AIModelsScreenProps) {
  const insets = useSafeAreaInsets();
  const config = useModelsConfig();
  const [showUrlEditor, setShowUrlEditor] = useState(false);
  const [signalSubmitted, setSignalSubmitted] = useState(false);
  const [cloudExpanded, setCloudExpanded] = useState(false);
  const [cloudDraft, setCloudDraft] = useState<CloudConfig>(config.cloudConfig);

  const activeAgentConfigs = AGENT_ROSTER.filter((a) =>
    config.enabledAgents.includes(a.id)
  );

  async function handleSubmitSignal() {
    await config.submitSignal();
    setSignalSubmitted(true);
    setTimeout(() => setSignalSubmitted(false), 2500);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[scr.screen, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={scr.header}>
          <TouchableOpacity onPress={onBack} style={scr.backBtn} activeOpacity={0.75}>
            <Text style={scr.backBtnText}>← Back</Text>
          </TouchableOpacity>
          <Text style={scr.title}>AI Models</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={scr.divider} />

        <ScrollView
          contentContainerStyle={[scr.content, { paddingBottom: TAB_BAR_HEIGHT + 48 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── SECTION 1: Ollama ─────────── */}
          <View style={scr.section}>
            <SectionHeader
              title="Local AI (Ollama)"
              sub="Models running on your device or local network"
            />
            <OllamaStatusBanner
              status={config.ollamaStatus}
              error={config.ollamaError}
              isChecking={config.isCheckingOllama}
              url={config.ollamaUrl}
              onRefresh={config.refreshOllama}
              onEditUrl={() => setShowUrlEditor((v) => !v)}
            />

            {showUrlEditor && (
              <OllamaUrlEditor
                value={config.ollamaUrl}
                onChange={config.setOllamaUrl}
                onSave={async () => { await config.saveOllamaUrl(); setShowUrlEditor(false); }}
                onCancel={() => setShowUrlEditor(false)}
              />
            )}

            {/* Model List */}
            {config.ollamaStatus === 'connected' && config.availableModels.length > 0 && (
              <Animated.View entering={FadeInDown.duration(400).springify()} style={scr.card}>
                <View style={scr.cardHeader}>
                  <Text style={scr.cardTitle}>Active Models</Text>
                  <Text style={scr.cardBadge}>{config.activeModels.length} selected</Text>
                </View>
                {config.availableModels.map((m) => (
                  <ModelRow
                    key={m.name}
                    name={m.name}
                    isActive={config.activeModels.includes(m.name)}
                    isDefault={config.defaultModel === m.name}
                    family={m.details?.family}
                    size={m.details?.parameter_size}
                    onToggle={() => config.toggleModel(m.name)}
                    onSetDefault={() => config.setDefaultModel(m.name)}
                  />
                ))}
              </Animated.View>
            )}

            {config.ollamaStatus === 'not_found' && (
              <Animated.View entering={FadeIn.duration(400)} style={scr.infoBox}>
                <Text style={scr.infoBoxTitle}>How to start Ollama</Text>
                <Text style={scr.infoBoxText}>
                  {'1. Install Ollama from ollama.ai\n2. Run: ollama serve\n3. Pull a model: ollama pull llama3.2\n4. Tap ↻ Refresh above'}
                </Text>
              </Animated.View>
            )}

            {config.ollamaStatus === 'no_models' && (
              <Animated.View entering={FadeIn.duration(400)} style={[scr.infoBox, { borderColor: OODA.warning }]}>
                <Text style={[scr.infoBoxTitle, { color: '#B45309' }]}>Install a model to get started</Text>
                <Text style={scr.infoBoxText}>
                  {'Run in your terminal:\n\nollama pull llama3.2\nollama pull qwen2.5\nollama pull gemma3\n\nThen tap ↻ Refresh'}
                </Text>
              </Animated.View>
            )}
          </View>

          {/* ── SECTION 2: Execution Mode ─── */}
          <View style={scr.section}>
            <SectionHeader title="Execution Mode" />
            <View style={scr.modeRow}>
              {(['single_agent', 'multi_agent'] as const).map((mode) => {
                const active = config.executionMode === mode;
                const label = mode === 'single_agent' ? 'Single Agent' : 'Multi-Agent';
                const iconName = mode === 'single_agent' ? 'flash' : 'people';
                const desc = mode === 'single_agent' ? 'Uses the Default Model directly' : 'Collaborative team discussion';
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => config.setExecutionMode(mode)}
                    style={[scr.modeCard, active && scr.modeCardActive]}
                    activeOpacity={0.8}
                  >
                    {active && <View style={scr.modeCheck}><Ionicons name="checkmark" size={12} color={OODA.textInverse} /></View>}
                    <Ionicons name={iconName} size={22} color={active ? OODA.primaryDark : OODA.textPrimary} style={{ marginBottom: 4 }} />
                    <Text style={[scr.modeName, active && scr.modeNameActive]}>{label}</Text>
                    <Text style={scr.modeDesc}>{desc}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── SECTION 3: Discussion Agents ─ */}
          {config.executionMode === 'multi_agent' && (
            <Animated.View entering={FadeInDown.duration(400).springify()} style={scr.section}>
              <View style={scr.sectionHeaderRow}>
                <SectionHeader
                  title="Discussion Agents"
                  sub="All selected agents run simultaneously — not sequentially"
                />
                <View style={[
                  scr.countBadge,
                  config.enabledAgents.length >= MAX_AGENTS && scr.countBadgeFull,
                ]}>
                  <Text style={[
                    scr.countText,
                    config.enabledAgents.length >= MAX_AGENTS && scr.countTextFull,
                  ]}>
                    {config.enabledAgents.length}/{MAX_AGENTS}
                  </Text>
                </View>
              </View>

              {config.enabledAgents.length === 0 ? (
                <View style={scr.emptyAgents}>
                  <Text style={scr.emptyAgentsText}>No discussion agents selected.</Text>
                  <Text style={scr.emptyAgentsSub}>Enable at least one agent below.</Text>
                </View>
              ) : null}

              <View style={scr.agentList}>
                {AGENT_ROSTER.map((agent) => {
                  const isEnabled = config.enabledAgents.includes(agent.id);
                  const isDisabled = !isEnabled && config.enabledAgents.length >= MAX_AGENTS;
                  const assigned = config.agentModelMap[agent.id] ?? '';
                  const modelNames = config.availableModels.map((m) => m.name);
                  return (
                    <AgentConfigCard
                      key={agent.id}
                      agent={agent}
                      isEnabled={isEnabled}
                      isDisabled={isDisabled}
                      assignedModel={assigned}
                      availableModels={modelNames}
                      onToggle={() => config.toggleAgent(agent.id)}
                      onModelChange={(m) => config.setAgentModel(agent.id, m)}
                    />
                  );
                })}
              </View>

              {/* Reviewer — always on */}
              <View style={scr.reviewerRow}>
                <View style={[ac.avatar, { backgroundColor: REVIEWER_AGENT.avatarBg }]}>
                  <Text style={ac.emoji}>{REVIEWER_AGENT.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={scr.reviewerName}>{REVIEWER_AGENT.name}</Text>
                  <Text style={scr.reviewerSub}>{REVIEWER_AGENT.focus}</Text>
                </View>
                <View style={scr.alwaysOnBadge}>
                  <Text style={scr.alwaysOnText}>Always On</Text>
                </View>
              </View>
            </Animated.View>
          )}

          {/* ── SECTION 4: Cloud Models ──── */}
          <View style={scr.section}>
            <TouchableOpacity
              onPress={() => setCloudExpanded((v) => !v)}
              style={scr.collapsibleHeader}
              activeOpacity={0.75}
            >
              <SectionHeader title="Cloud Models" sub="OpenAI, Anthropic, custom endpoints" />
              <Ionicons name={cloudExpanded ? "chevron-up" : "chevron-down"} size={18} color={OODA.textTertiary} />
            </TouchableOpacity>

            {cloudExpanded && (
              <Animated.View entering={FadeInDown.duration(300).springify()} style={scr.card}>
                {(
                  [
                    { key: 'provider', label: 'Provider', placeholder: 'e.g. OpenAI' },
                    { key: 'apiUrl', label: 'API URL', placeholder: 'https://api.openai.com/v1' },
                    { key: 'apiKey', label: 'API Key', placeholder: 'sk-...' },
                    { key: 'modelName', label: 'Model Name', placeholder: 'gpt-4o' },
                  ] as const
                ).map((f) => (
                  <View key={f.key} style={scr.cloudField}>
                    <Text style={scr.cloudLabel}>{f.label}</Text>
                    <TextInput
                      style={scr.cloudInput}
                      value={cloudDraft[f.key]}
                      onChangeText={(v) => setCloudDraft((prev) => ({ ...prev, [f.key]: v }))}
                      placeholder={f.placeholder}
                      placeholderTextColor={OODA.textMuted}
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry={f.key === 'apiKey'}
                    />
                  </View>
                ))}
                <TouchableOpacity
                  onPress={() => config.setCloudConfig(cloudDraft)}
                  style={scr.cloudSaveBtn}
                  activeOpacity={0.85}
                >
                  <Text style={scr.cloudSaveText}>Save Cloud Config</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>

          {/* ── SECTION 5: Manual Signal ──── */}
          <View style={scr.section}>
            <SectionHeader
              title="Manual Signal"
              sub="Temporary input for the multi-agent pipeline — replaces live WebSocket feed"
            />
            <View style={scr.card}>
              <TextInput
                style={scr.signalInput}
                value={config.manualSignal}
                onChangeText={config.setManualSignal}
                placeholder="e.g. RivalFlow reduced pricing from ₹999 to ₹749."
                placeholderTextColor={OODA.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <View style={scr.signalActions}>
                <TouchableOpacity onPress={config.clearSignal} style={scr.clearBtn} activeOpacity={0.75}>
                  <Text style={scr.clearBtnText}>Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitSignal}
                  style={[scr.runBtn, !config.manualSignal.trim() && scr.runBtnDisabled]}
                  disabled={!config.manualSignal.trim()}
                  activeOpacity={0.85}
                >
                  {signalSubmitted ? (
                    <Animated.Text entering={FadeIn.duration(200)} style={scr.runBtnText}><Ionicons name="checkmark-circle" size={16} color={OODA.textInverse} /> Queued</Animated.Text>
                  ) : (
                    <Text style={scr.runBtnText}><Ionicons name="play" size={14} color={OODA.textInverse} />  Run Analysis</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ── SECTION 6: Pipeline Preview ─ */}
          <View style={scr.section}>
            <SectionHeader title="Pipeline Preview" />
            <PipelinePreview
              mode={config.executionMode}
              agents={activeAgentConfigs}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const scr = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 15, fontWeight: '600', color: OODA.primary },
  title: { fontSize: 17, fontWeight: '700', color: OODA.textPrimary },
  divider: { height: 1, backgroundColor: OODA.border },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 28 },

  section: { gap: 12 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },

  card: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 16,
    gap: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: OODA.border },
  cardTitle: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  cardBadge: { fontSize: 12, fontWeight: '600', color: OODA.primary },

  infoBox: { backgroundColor: OODA.dangerBg, borderRadius: Radius.lg, borderWidth: 1, borderColor: OODA.dangerGlow, padding: 14, gap: 6 },
  infoBoxTitle: { fontSize: 13, fontWeight: '700', color: OODA.danger },
  infoBoxText: { fontSize: 12, color: OODA.textSecondary, lineHeight: 19, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  modeRow: { flexDirection: 'row', gap: 12 },
  modeCard: {
    flex: 1, backgroundColor: OODA.card, borderRadius: Radius.xl, borderWidth: 1.5,
    borderColor: OODA.border, padding: 16, gap: 4, alignItems: 'flex-start', position: 'relative',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  modeCardActive: { borderColor: OODA.primary, backgroundColor: OODA.primaryGlow },
  modeCheck: { position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: 10, backgroundColor: OODA.primary, justifyContent: 'center', alignItems: 'center' },
  modeCheckText: { fontSize: 11, color: OODA.textInverse, fontWeight: '700' },
  modeEmoji: { fontSize: 22, marginBottom: 4 },
  modeName: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  modeNameActive: { color: OODA.primaryDark },
  modeDesc: { fontSize: 11, color: OODA.textTertiary, lineHeight: 16 },

  countBadge: { backgroundColor: OODA.primaryGlow, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 3, marginTop: 2 },
  countBadgeFull: { backgroundColor: OODA.warningBg },
  countText: { fontSize: 12, fontWeight: '700', color: OODA.primary },
  countTextFull: { color: '#B45309' },

  agentList: { gap: 10 },

  emptyAgents: { backgroundColor: OODA.bgSurface, borderRadius: Radius.lg, padding: 16, alignItems: 'center', gap: 4 },
  emptyAgentsText: { fontSize: 14, fontWeight: '600', color: OODA.textPrimary },
  emptyAgentsSub: { fontSize: 12, color: OODA.textMuted },

  reviewerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: OODA.card, borderRadius: Radius.xl, borderWidth: 1.5,
    borderColor: OODA.primaryGlowStrong, padding: 14,
  },
  reviewerName: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  reviewerSub: { fontSize: 11, color: OODA.textTertiary, marginTop: 1 },
  alwaysOnBadge: { backgroundColor: OODA.primaryGlow, borderRadius: Radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  alwaysOnText: { fontSize: 11, fontWeight: '700', color: OODA.primaryDark },

  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  chevron: { fontSize: 14, color: OODA.textTertiary, marginTop: 2 },

  cloudField: { gap: 5, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: OODA.borderSubtle },
  cloudLabel: { fontSize: 11, fontWeight: '700', color: OODA.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  cloudInput: { fontSize: 14, color: OODA.textPrimary, paddingVertical: 4 },
  cloudSaveBtn: { backgroundColor: OODA.primary, borderRadius: Radius.pill, height: 44, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  cloudSaveText: { fontSize: 14, fontWeight: '700', color: OODA.textInverse },

  signalInput: { fontSize: 14, color: OODA.textPrimary, minHeight: 100, lineHeight: 22, textAlignVertical: 'top', marginBottom: 12 },
  signalActions: { flexDirection: 'row', gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: OODA.border },
  clearBtn: { height: 44, paddingHorizontal: 18, borderRadius: Radius.pill, borderWidth: 1.5, borderColor: OODA.border, justifyContent: 'center', alignItems: 'center' },
  clearBtnText: { fontSize: 14, fontWeight: '600', color: OODA.textSecondary },
  runBtn: { flex: 1, height: 44, borderRadius: Radius.pill, backgroundColor: OODA.primary, justifyContent: 'center', alignItems: 'center', shadowColor: OODA.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  runBtnDisabled: { backgroundColor: OODA.border, shadowOpacity: 0 },
  runBtnText: { fontSize: 14, fontWeight: '700', color: OODA.textInverse },
});
