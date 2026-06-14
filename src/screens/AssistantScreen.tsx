// ─────────────────────────────────────────────
// OODA — Multi-Agent Discussion Screen
// Ask AI tab: discussion engine + single agent
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import {
  AGENT_ROSTER,
  REVIEWER_AGENT,
  type AgentConfig,
  type AgentRole,
  type DiscussionMessage,
  type DiscussionStatus,
  type ExecutionMode,
} from '@/constants/agentData';
import { useModelsConfig } from '@/hooks/useModelsConfig';
import { engine, type ExecutionEvent } from '@/services/execution/ExecutionEngine';

// ── Agent lookup map ──────────────────────────
const AGENT_MAP: Record<AgentRole | 'reviewer', AgentConfig> = {
  marketing: AGENT_ROSTER[0],
  product: AGENT_ROSTER[1],
  sales: AGENT_ROSTER[2],
  strategy: AGENT_ROSTER[3],
  reviewer: REVIEWER_AGENT,
};

// ── Typing dots ───────────────────────────────
function TypingDots({ color }: { color: string }) {
  const dot1 = useSharedValue(0.3);
  const dot2 = useSharedValue(0.3);
  const dot3 = useSharedValue(0.3);

  useEffect(() => {
    const bounce = (sv: typeof dot1, delay: number) => {
      sv.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      );
    };
    setTimeout(() => bounce(dot1, 0), 0);
    setTimeout(() => bounce(dot2, 0), 200);
    setTimeout(() => bounce(dot3, 0), 400);
  }, []);

  const s1 = useAnimatedStyle(() => ({ opacity: dot1.value }));
  const s2 = useAnimatedStyle(() => ({ opacity: dot2.value }));
  const s3 = useAnimatedStyle(() => ({ opacity: dot3.value }));

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', paddingVertical: 4 }}>
      {[s1, s2, s3].map((s, i) => (
        <Animated.View
          key={i}
          style={[{ width: 7, height: 7, borderRadius: 4, backgroundColor: color }, s]}
        />
      ))}
    </View>
  );
}

// ── Parallel Processing Indicator ─────────────
function ParallelBadge({ count }: { count: number }) {
  return (
    <Animated.View entering={FadeIn.duration(300)} style={pb.container}>
      <Ionicons name="flash" size={13} color={OODA.primaryDark} />
      <Text style={pb.text}>{count} agents analysing simultaneously</Text>
    </Animated.View>
  );
}

const pb = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    backgroundColor: OODA.primaryGlow,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: OODA.primaryGlowStrong,
  },
  icon: { fontSize: 12 },
  text: { fontSize: 12, fontWeight: '700', color: OODA.primaryDark },
});

// ── Round Header ──────────────────────────────
function RoundHeader({ round }: { round: number }) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={rh.row}>
      <View style={rh.line} />
      <Text style={rh.label}>Round {round}</Text>
      <View style={rh.line} />
    </Animated.View>
  );
}

const rh = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  line: { flex: 1, height: 1, backgroundColor: OODA.border },
  label: { fontSize: 11, fontWeight: '700', color: OODA.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
});

// ── Discussion Bubble ─────────────────────────
function DiscussionBubble({
  message,
  index,
}: {
  message: DiscussionMessage;
  index: number;
}) {
  const agent = AGENT_MAP[message.agentId];
  const isReviewer = message.agentId === 'reviewer';
  const refAgent = message.referencesAgent ? AGENT_MAP[message.referencesAgent] : null;

  return (
    <Animated.View
      entering={FadeInLeft.delay(index * 80).duration(400).springify()}
      style={[bubble.container, isReviewer && bubble.reviewerContainer]}
    >
      {/* Agent label row */}
      <View style={bubble.labelRow}>
        <View style={[bubble.avatar, { backgroundColor: agent.avatarBg }]}>
          <Text style={bubble.avatarEmoji}>{agent.emoji}</Text>
        </View>
        <View style={bubble.labelInfo}>
          <Text style={[bubble.agentName, { color: agent.avatarColor }]}>{agent.name}</Text>
          {refAgent && (
            <Text style={bubble.refText}><Ionicons name="return-down-back-outline" size={11} color={OODA.textMuted} /> responding to {refAgent.shortName} AI</Text>
          )}
        </View>
        {message.confidence !== undefined && (
          <View style={[bubble.confidenceBadge, { backgroundColor: agent.avatarBg }]}>
            <Text style={[bubble.confidenceText, { color: agent.avatarColor }]}>
              {message.confidence}% confident
            </Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[bubble.content, isReviewer && bubble.reviewerContent]}>
        <Text style={[bubble.text, isReviewer && bubble.reviewerText]}>{message.content}</Text>
      </View>
    </Animated.View>
  );
}

const bubble = StyleSheet.create({
  container: {
    gap: 8,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  reviewerContainer: {
    borderColor: OODA.primaryGlowStrong,
    backgroundColor: '#F6FBF3',
    shadowColor: OODA.primary,
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarEmoji: { fontSize: 17 },
  labelInfo: { flex: 1, gap: 1 },
  agentName: { fontSize: 13, fontWeight: '700' },
  refText: { fontSize: 11, color: OODA.textMuted, fontStyle: 'italic' },
  confidenceBadge: { borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 3 },
  confidenceText: { fontSize: 11, fontWeight: '700' },
  content: {},
  reviewerContent: {},
  text: { fontSize: 14, color: OODA.textSecondary, lineHeight: 22 },
  reviewerText: { color: OODA.textPrimary, fontWeight: '500' },
});

// ── Thinking Row (agents generating) ─────────
function AgentsThinking({
  agents,
  label,
}: {
  agents: AgentConfig[];
  label: string;
}) {
  return (
    <Animated.View entering={FadeIn.duration(400)} style={tk.container}>
      <Text style={tk.label}>{label}</Text>
      <View style={tk.agentsRow}>
        {agents.map((agent) => (
          <View key={agent.id} style={tk.agentChip}>
            <View style={[tk.chipAvatar, { backgroundColor: agent.avatarBg }]}>
              <Text style={tk.chipEmoji}>{agent.emoji}</Text>
            </View>
            <TypingDots color={agent.avatarColor} />
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const tk = StyleSheet.create({
  container: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 16,
    gap: 12,
  },
  label: { fontSize: 12, fontWeight: '600', color: OODA.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  agentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  agentChip: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipAvatar: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  chipEmoji: { fontSize: 14 },
});

// ── Single Agent Chat ─────────────────────────
const SINGLE_AI_RESPONSE =
  "Based on what I see right now, RivalFlow's pricing change is the biggest development to watch. They've reduced their starter plan significantly, which puts direct pressure on your SMB deals. I'd recommend your sales team reach out to open deals proactively this week and frame the conversation around your product's value rather than price.";

function SingleAgentChat({ onOpenModels }: { onOpenModels: () => void }) {
  const [messages, setMessages] = useState<{ id: string; role: 'user' | 'assistant'; content: string }[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your OODA AI. Ask me anything about your competitors or market.",
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function send(text: string) {
    if (!text.trim()) return;
    setMessages((p) => [...p, { id: Date.now().toString(), role: 'user', content: text.trim() }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((p) => [
        ...p,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: SINGLE_AI_RESPONSE },
      ]);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
    }, 1600);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((m) => (
          <View
            key={m.id}
            style={[sa.bubble, m.role === ('user' as string) ? sa.userBubble : sa.aiBubble]}
          >
            <Text style={[sa.text, m.role === ('user' as string) && sa.userText]}>{m.content}</Text>
          </View>
        ))}
        {typing && (
          <View style={sa.aiBubble}>
            <TypingDots color={OODA.primary} />
          </View>
        )}
      </ScrollView>

      <View style={sa.inputBar}>
        <View style={sa.inputRow}>
          <TextInput
            style={sa.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your competitors…"
            placeholderTextColor={OODA.textMuted}
            multiline
            onSubmitEditing={() => send(input)}
            blurOnSubmit
          />
          <TouchableOpacity
            onPress={() => send(input)}
            style={[sa.sendBtn, { backgroundColor: input.trim() ? OODA.primary : OODA.border }]}
            disabled={!input.trim()}
            activeOpacity={0.8}
          >
            <Ionicons name="send" size={14} color={input.trim() ? OODA.textInverse : OODA.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const sa = StyleSheet.create({
  bubble: { borderRadius: Radius.lg, padding: 14, maxWidth: '85%' },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: OODA.card,
    borderWidth: 1,
    borderColor: OODA.border,
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: OODA.primary,
    borderBottomRightRadius: 4,
  },
  text: { fontSize: 14, color: OODA.textSecondary, lineHeight: 21 },
  userText: { color: OODA.textInverse, fontWeight: '500' },
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderTopWidth: 1,
    borderTopColor: OODA.border,
    backgroundColor: OODA.bg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: OODA.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 52,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: OODA.textPrimary,
    maxHeight: 100,
    alignSelf: 'center',
    paddingTop: Platform.OS === 'ios' ? 4 : 0,
  },
  sendBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', flexShrink: 0, alignSelf: 'flex-end' },
  sendIcon: { fontSize: 16, fontWeight: '700' },
});

// ── Empty State ───────────────────────────────
function EmptyAgentState({ onConfigure }: { onConfigure: () => void }) {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={es.wrap}>
      <Ionicons name="hardware-chip-outline" size={52} color={OODA.textSecondary} style={{ marginBottom: 4 }} />
      <Text style={es.title}>No Active Agents</Text>
      <Text style={es.sub}>
        No AI agents are currently configured. Enable at least one agent from the Models page to begin analysis.
      </Text>
      <TouchableOpacity onPress={onConfigure} style={es.btn} activeOpacity={0.85}>
        <Text style={es.btnText}>Configure Agents</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const es = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 14 },
  icon: { fontSize: 52, marginBottom: 4 },
  title: { fontSize: 20, fontWeight: '700', color: OODA.textPrimary, textAlign: 'center' },
  sub: { fontSize: 14, color: OODA.textTertiary, textAlign: 'center', lineHeight: 21 },
  btn: {
    marginTop: 8,
    backgroundColor: OODA.primary,
    borderRadius: Radius.pill,
    paddingHorizontal: 28,
    paddingVertical: 14,
    shadowColor: OODA.primary,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: OODA.textInverse },
});

// ─────────────────────────────────────────────
// MAIN ASSISTANT SCREEN
// ─────────────────────────────────────────────

// Discussion stages with timing
const ROUND1_THINK_MS = 2000;
const ROUND1_REVEAL_DELAY = 120;
const ROUND2_THINK_MS = 2200;
const ROUND2_REVEAL_DELAY = 150;
const REVIEWER_THINK_MS = 1800;

export function AssistantScreen({ onOpenModels }: { onOpenModels: () => void }) {
  const insets = useSafeAreaInsets();
  const config = useModelsConfig();
  const enabledAgents = config.enabledAgents;
  const executionMode = config.executionMode;

  // Discussion state
  const [status, setStatus] = useState<DiscussionStatus>('idle');
  const [visibleMessages, setVisibleMessages] = useState<DiscussionMessage[]>([]);
  const [showRound2Header, setShowRound2Header] = useState(false);
  const [showReviewerHeader, setShowReviewerHeader] = useState(false);
  const [round1Thinking, setRound1Thinking] = useState(false);
  const [round2Thinking, setRound2Thinking] = useState(false);
  const [reviewerThinking, setReviewerThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = engine.subscribe((event: ExecutionEvent) => {
      setStatus((event.state === 'failed' ? 'idle' : event.state) as DiscussionStatus);
      setVisibleMessages(event.messages);
      
      setRound1Thinking(event.state === 'round1');
      
      if (event.state === 'round2') {
        setShowRound2Header(true);
        setRound2Thinking(true);
      } else {
        setRound2Thinking(false);
      }
      
      if (event.state === 'reviewing') {
        setShowRound2Header(true);
        setShowReviewerHeader(true);
        setReviewerThinking(true);
      } else {
        setReviewerThinking(false);
      }
      
      if (event.state === 'done') {
        setShowRound2Header(true);
        setShowReviewerHeader(true);
      }

      if (event.state === 'idle') {
        setShowRound2Header(false);
        setShowReviewerHeader(false);
      }
      
      scrollDown();
    });
    
    return unsubscribe;
  }, []);

  function scrollDown() {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function runDiscussion() {
    if (enabledAgents.length === 0) return;
    
    // If it's running, this acts as a stop button
    if (status !== 'idle' && status !== 'done') {
      engine.abort();
      return;
    }

    // Use manual signal or last signal
    const signalToUse = config.manualSignal.trim() ? config.manualSignal : '';
    engine.run(signalToUse);
  }

  const activeAgentConfigs = AGENT_ROSTER.filter((a) => enabledAgents.includes(a.id));
  const isRunning = status !== 'idle' && status !== 'done';

  return (
    <KeyboardAvoidingView 
      style={[main.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={main.header}>
        <View>
          <Text style={main.title}>Ask OODA AI</Text>
          <Text style={main.subtitle}>
            {executionMode === 'multi_agent'
              ? `${enabledAgents.length} agent${enabledAgents.length !== 1 ? 's' : ''} · Discussion mode`
              : 'Single agent · Direct response'}
          </Text>
        </View>
        <TouchableOpacity onPress={onOpenModels} style={main.modelsBtn} activeOpacity={0.8}>
          <Text style={main.modelsBtnText}>⚙ Models</Text>
        </TouchableOpacity>
      </Animated.View>
      <View style={main.divider} />

      {/* Single Agent Mode */}
      {executionMode === 'single_agent' && (
        <View style={{ flex: 1, paddingBottom: TAB_BAR_HEIGHT + 24 }}>
          <SingleAgentChat onOpenModels={onOpenModels} />
        </View>
      )}

      {/* Multi-Agent Mode */}
      {executionMode === 'multi_agent' && (
        <>
          {enabledAgents.length === 0 ? (
            <EmptyAgentState onConfigure={onOpenModels} />
          ) : (
            <ScrollView
              ref={scrollRef}
              style={main.scroll}
              contentContainerStyle={[main.scrollContent, { paddingBottom: TAB_BAR_HEIGHT + 100 }]}
              showsVerticalScrollIndicator={false}
            >
              {/* Signal card — always visible */}
              <Animated.View entering={FadeInDown.delay(80).duration(400).springify()} style={main.signalCard}>
                <View style={main.signalTop}>
                  <Text style={main.signalLabel}>SIGNAL</Text>
                  <View style={[main.signalBadge, { flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: OODA.danger, marginRight: 4 }} />
                    <Text style={main.signalBadgeText}>Live</Text>
                  </View>
                </View>
                <Text style={main.signalHeadline}>Custom Signal Input</Text>
                {status === 'idle' ? (
                  <TextInput
                    style={main.signalInput}
                    placeholder="Enter manual competitive signal..."
                    placeholderTextColor={OODA.textMuted}
                    value={config.manualSignal}
                    onChangeText={config.setManualSignal}
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <Text style={main.signalDetail}>
                    {config.manualSignal || 'Currently processing active signal...'}
                  </Text>
                )}
              </Animated.View>

              {/* Architecture diagram — idle state */}
              {status === 'idle' && (
                <Animated.View entering={FadeIn.duration(500)} style={main.archCard}>
                  <Text style={main.archTitle}>How this works</Text>
                  <Text style={main.archSub}>
                    All {enabledAgents.length} agents will receive this signal at the same time — not one after another.
                  </Text>
                  {/* Flow diagram */}
                  <View style={arch.diagram}>
                    <View style={arch.signalNode}>
                      <Text style={arch.signalNodeText}>Signal</Text>
                    </View>
                    <Text style={arch.arrow}>↓</Text>
                    <View style={arch.agentsRow}>
                      {activeAgentConfigs.map((agent) => (
                        <View key={agent.id} style={[arch.agentNode, { backgroundColor: agent.avatarBg }]}>
                          <Text style={arch.agentNodeEmoji}>{agent.emoji}</Text>
                          <Text style={[arch.agentNodeName, { color: agent.avatarColor }]}>
                            {agent.shortName}
                          </Text>
                        </View>
                      ))}
                    </View>
                    <Text style={arch.arrow}>↓</Text>
                    <View style={arch.sharedNode}>
                      <Text style={arch.sharedText}>Discussion</Text>
                    </View>
                    <Text style={arch.arrow}>↓</Text>
                    <View style={[arch.signalNode, { backgroundColor: REVIEWER_AGENT.avatarBg }]}>
                      <Text style={[arch.signalNodeText, { color: REVIEWER_AGENT.avatarColor }]}>
                        🏛 Reviewer
                      </Text>
                    </View>
                    <Text style={arch.arrow}>↓</Text>
                    <View style={[arch.signalNode, { backgroundColor: OODA.primaryGlow }]}>
                      <Text style={[arch.signalNodeText, { color: OODA.primaryDark }]}>Final Verdict</Text>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* Parallel badge */}
              {(status === 'round1') && (
                <ParallelBadge count={enabledAgents.length} />
              )}

              {/* Round 1 thinking */}
              {round1Thinking && (
                <AgentsThinking
                  agents={activeAgentConfigs}
                  label="Round 1 — All agents analysing independently"
                />
              )}

              {/* Round 1 messages */}
              {visibleMessages.filter((m) => m.round === 1).map((msg, i) => (
                <DiscussionBubble key={msg.id} message={msg} index={i} />
              ))}

              {/* Round 2 header */}
              {showRound2Header && <RoundHeader round={2} />}

              {/* Round 2 thinking */}
              {round2Thinking && (
                <AgentsThinking
                  agents={activeAgentConfigs}
                  label="Round 2 — Agents cross-reviewing each other"
                />
              )}

              {/* Round 2 messages */}
              {visibleMessages.filter((m) => m.round === 2).map((msg, i) => (
                <DiscussionBubble key={msg.id} message={msg} index={i} />
              ))}

              {/* Reviewer header */}
              {showReviewerHeader && (
                <Animated.View entering={FadeIn.duration(400)} style={main.reviewerHeaderRow}>
                  <View style={main.reviewerLine} />
                  <Text style={main.reviewerHeaderText}>🏛 Reviewer Verdict</Text>
                  <View style={main.reviewerLine} />
                </Animated.View>
              )}

              {/* Reviewer thinking */}
              {reviewerThinking && (
                <AgentsThinking
                  agents={[REVIEWER_AGENT]}
                  label="Reviewer synthesising all responses"
                />
              )}

              {/* Reviewer verdict */}
              {visibleMessages.filter((m) => m.agentId === 'reviewer').map((msg, i) => (
                <DiscussionBubble key={msg.id} message={msg} index={i} />
              ))}

              {/* Done state */}
              {status === 'done' && (
                <Animated.View entering={FadeInUp.duration(400).springify()} style={main.doneBanner}>
                  <Text style={main.doneBannerText}>Discussion complete · {visibleMessages.length} messages across 2 rounds</Text>
                </Animated.View>
              )}
            </ScrollView>
          )}

          {/* Run / Reset CTA */}
          {enabledAgents.length > 0 && (
            <Animated.View
              entering={FadeInDown.delay(300).duration(400).springify()}
              style={[main.ctaBar, { paddingBottom: TAB_BAR_HEIGHT + 16 }]}
            >
              {status === 'idle' || status === 'done' ? (
                <TouchableOpacity
                  onPress={runDiscussion}
                  style={[main.runBtn, status === 'done' && main.runBtnReset]}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={status === 'done' ? "refresh" : "play"} size={16} color={OODA.textInverse} />
                    <Text style={main.runBtnText}>
                      {status === 'done' ? 'Run Again' : 'Start Discussion'}
                    </Text>
                  </View>
                  {status === 'idle' && (
                    <Text style={main.runBtnSub}>
                      {enabledAgents.length} agents · 2 rounds · Reviewer
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <View style={main.runningBar}>
                  <TouchableOpacity onPress={() => engine.abort()} style={main.stopBtn} activeOpacity={0.8}>
                    <Ionicons name="stop" size={16} color={OODA.danger} />
                  </TouchableOpacity>
                  <TypingDots color={OODA.primary} />
                  <Text style={main.runningText}>
                    {status === 'round1' && 'Round 1 in progress…'}
                    {status === 'round2' && 'Round 2 — cross-reviewing…'}
                    {status === 'reviewing' && 'Reviewer synthesising…'}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </>
      )}
    </KeyboardAvoidingView>
  );
}

const arch = StyleSheet.create({
  diagram: { alignItems: 'center', gap: 8, paddingVertical: 4 },
  signalNode: {
    backgroundColor: OODA.bgSurface,
    borderWidth: 1,
    borderColor: OODA.border,
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  signalNodeText: { fontSize: 13, fontWeight: '700', color: OODA.textSecondary },
  arrow: { fontSize: 16, color: OODA.textMuted },
  agentsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  agentNode: { borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', gap: 3 },
  agentNodeEmoji: { fontSize: 16 },
  agentNodeName: { fontSize: 11, fontWeight: '700' },
  sharedNode: {
    backgroundColor: OODA.border,
    borderRadius: Radius.md,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sharedText: { fontSize: 13, fontWeight: '600', color: OODA.textTertiary },
});

const main = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
  },
  title: { fontSize: 22, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: OODA.textTertiary, fontWeight: '500', marginTop: 2 },
  modelsBtn: {
    backgroundColor: OODA.card,
    borderWidth: 1.5,
    borderColor: OODA.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  modelsBtnText: { fontSize: 13, fontWeight: '700', color: OODA.textSecondary },
  divider: { height: 1, backgroundColor: OODA.border, marginHorizontal: 20 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  // Signal card
  signalCard: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 18,
    gap: 10,
  },
  signalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  signalLabel: { fontSize: 11, fontWeight: '700', color: OODA.textMuted, letterSpacing: 1, textTransform: 'uppercase' },
  signalBadge: {
    backgroundColor: OODA.dangerBg,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  signalBadgeText: { fontSize: 12, fontWeight: '700', color: OODA.danger },
  signalHeadline: { fontSize: 16, fontWeight: '700', color: OODA.textPrimary, lineHeight: 22 },
  signalDetail: { fontSize: 13, color: OODA.textTertiary, lineHeight: 18, marginTop: 4 },
  signalInput: {
    fontSize: 13,
    color: OODA.textPrimary,
    lineHeight: 18,
    marginTop: 4,
    backgroundColor: OODA.bg,
    borderRadius: Radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: OODA.border,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // Arch card
  archCard: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 20,
    gap: 12,
  },
  archTitle: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  archSub: { fontSize: 13, color: OODA.textTertiary, lineHeight: 19 },

  // Reviewer header
  reviewerHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  reviewerLine: { flex: 1, height: 1.5, backgroundColor: OODA.primaryGlowStrong },
  reviewerHeaderText: { fontSize: 13, fontWeight: '700', color: OODA.primaryDark },

  // Done banner
  doneBanner: {
    backgroundColor: OODA.successBg,
    borderRadius: Radius.lg,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OODA.success,
  },
  doneBannerText: { fontSize: 13, fontWeight: '600', color: OODA.success },

  // CTA bar
  ctaBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: OODA.border,
    backgroundColor: OODA.bg,
  },
  runBtn: {
    backgroundColor: OODA.primary,
    borderRadius: Radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 4,
    shadowColor: OODA.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  runBtnReset: { backgroundColor: OODA.textSecondary },
  runBtnText: { fontSize: 16, fontWeight: '700', color: OODA.textInverse },
  runBtnSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  runningBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 14 },
  runningText: { fontSize: 14, fontWeight: '600', color: OODA.textTertiary, flex: 1 },
  stopBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: OODA.dangerBg, borderWidth: 1, borderColor: OODA.dangerGlow, justifyContent: 'center', alignItems: 'center' },
});
