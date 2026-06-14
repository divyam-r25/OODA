// ─────────────────────────────────────────────
// OODA — Models / Agent Configuration Screen
// Enable / disable agents & set execution mode
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import {
  AGENT_ROSTER,
  REVIEWER_AGENT,
  type AgentRole,
  type ExecutionMode,
} from '@/constants/agentData';

const MAX_PARTICIPANTS = 4;

interface ModelsScreenProps {
  enabledAgents: AgentRole[];
  executionMode: ExecutionMode;
  onToggleAgent: (id: AgentRole) => void;
  onSetMode: (mode: ExecutionMode) => void;
  onBack: () => void;
}

export function ModelsScreen({
  enabledAgents,
  executionMode,
  onToggleAgent,
  onSetMode,
  onBack,
}: ModelsScreenProps) {
  const insets = useSafeAreaInsets();
  const activeCount = enabledAgents.length;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>AI Models</Text>
        <View style={styles.headerRight} />
      </Animated.View>
      <View style={styles.divider} />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_HEIGHT + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Execution Mode */}
        <Animated.View entering={FadeInDown.delay(50).duration(450).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>Execution Mode</Text>
          <Text style={styles.sectionSub}>Choose how the AI analyses competitor signals.</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              onPress={() => onSetMode('multi_agent')}
              style={[styles.modeCard, executionMode === 'multi_agent' && styles.modeCardActive]}
              activeOpacity={0.8}
            >
              <Text style={styles.modeIcon}>🤝</Text>
              <Text style={[styles.modeName, executionMode === 'multi_agent' && styles.modeNameActive]}>
                Multi-Agent
              </Text>
              <Text style={[styles.modeSub, executionMode === 'multi_agent' && styles.modeSubActive]}>
                Collaborative team discussion
              </Text>
              {executionMode === 'multi_agent' && (
                <View style={styles.modeCheck}>
                  <Text style={styles.modeCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onSetMode('single_agent')}
              style={[styles.modeCard, executionMode === 'single_agent' && styles.modeCardActive]}
              activeOpacity={0.8}
            >
              <Text style={styles.modeIcon}>⚡</Text>
              <Text style={[styles.modeName, executionMode === 'single_agent' && styles.modeNameActive]}>
                Single Agent
              </Text>
              <Text style={[styles.modeSub, executionMode === 'single_agent' && styles.modeSubActive]}>
                Fast, direct response
              </Text>
              {executionMode === 'single_agent' && (
                <View style={styles.modeCheck}>
                  <Text style={styles.modeCheckText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Discussion Agents */}
        {executionMode === 'multi_agent' && (
          <Animated.View entering={FadeInDown.delay(120).duration(450).springify()} style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Discussion Agents</Text>
              <View style={[
                styles.countBadge,
                activeCount >= MAX_PARTICIPANTS && styles.countBadgeFull,
              ]}>
                <Text style={[
                  styles.countText,
                  activeCount >= MAX_PARTICIPANTS && styles.countTextFull,
                ]}>
                  {activeCount}/{MAX_PARTICIPANTS}
                </Text>
              </View>
            </View>
            <Text style={styles.sectionSub}>
              Select up to {MAX_PARTICIPANTS} agents. They will all analyse the signal simultaneously — not one after another.
            </Text>

            <View style={styles.agentList}>
              {AGENT_ROSTER.map((agent, i) => {
                const isEnabled = enabledAgents.includes(agent.id);
                const isDisabled = !isEnabled && activeCount >= MAX_PARTICIPANTS;

                return (
                  <Animated.View
                    key={agent.id}
                    entering={FadeInDown.delay(150 + i * 70).duration(400).springify()}
                  >
                    <TouchableOpacity
                      onPress={() => !isDisabled && onToggleAgent(agent.id)}
                      activeOpacity={isDisabled ? 1 : 0.8}
                      style={[
                        styles.agentCard,
                        isEnabled && styles.agentCardActive,
                        isDisabled && styles.agentCardDisabled,
                      ]}
                    >
                      <View style={[styles.agentAvatar, { backgroundColor: agent.avatarBg }]}>
                        <Text style={styles.agentEmoji}>{agent.emoji}</Text>
                      </View>
                      <View style={styles.agentInfo}>
                        <Text style={[styles.agentName, isEnabled && styles.agentNameActive]}>
                          {agent.name}
                        </Text>
                        <Text style={styles.agentFocus}>{agent.focus}</Text>
                      </View>
                      <Switch
                        value={isEnabled}
                        onValueChange={(_val: boolean) => { if (!isDisabled) { onToggleAgent(agent.id); } }}
                        trackColor={{ false: OODA.border, true: OODA.primaryGlowStrong }}
                        thumbColor={isEnabled ? OODA.primary : OODA.textMuted}
                        disabled={isDisabled}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Reviewer info */}
        <Animated.View entering={FadeInDown.delay(400).duration(450).springify()} style={styles.reviewerCard}>
          <View style={[styles.agentAvatar, { backgroundColor: REVIEWER_AGENT.avatarBg }]}>
            <Text style={styles.agentEmoji}>{REVIEWER_AGENT.emoji}</Text>
          </View>
          <View style={styles.agentInfo}>
            <Text style={styles.agentName}>{REVIEWER_AGENT.name}</Text>
            <Text style={styles.agentFocus}>{REVIEWER_AGENT.focus}</Text>
          </View>
          <View style={styles.alwaysOnBadge}>
            <Text style={styles.alwaysOnText}>Always On</Text>
          </View>
        </Animated.View>

        {/* Architecture note */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(450).springify()}
          style={styles.infoBox}
        >
          <Text style={styles.infoIcon}>ℹ</Text>
          <Text style={styles.infoText}>
            In Multi-Agent mode, all selected agents receive the same signal at once and discuss simultaneously — not sequentially. The Reviewer joins only after the discussion completes to produce the final verdict.
          </Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
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
  headerRight: { width: 60 },
  divider: { height: 1, backgroundColor: OODA.border, marginHorizontal: 20 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },

  // Sections
  section: { gap: 14 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: OODA.textPrimary },
  sectionSub: { fontSize: 13, color: OODA.textTertiary, lineHeight: 19, marginTop: -8 },

  // Count badge
  countBadge: {
    backgroundColor: OODA.primaryGlow,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countBadgeFull: { backgroundColor: OODA.warningBg },
  countText: { fontSize: 12, fontWeight: '700', color: OODA.primary },
  countTextFull: { color: '#B45309' },

  // Mode cards
  modeRow: { flexDirection: 'row', gap: 12 },
  modeCard: {
    flex: 1,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: OODA.border,
    padding: 16,
    gap: 4,
    alignItems: 'flex-start',
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeCardActive: { borderColor: OODA.primary, backgroundColor: OODA.primaryGlow },
  modeIcon: { fontSize: 22, marginBottom: 4 },
  modeName: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary },
  modeNameActive: { color: OODA.primaryDark },
  modeSub: { fontSize: 11, color: OODA.textTertiary, lineHeight: 16 },
  modeSubActive: { color: OODA.primaryDark, opacity: 0.8 },
  modeCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: OODA.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeCheckText: { fontSize: 11, color: OODA.textInverse, fontWeight: '700' },

  // Agent cards
  agentList: { gap: 10 },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: OODA.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  agentCardActive: { borderColor: OODA.primaryGlowStrong, backgroundColor: '#FAFFFA' },
  agentCardDisabled: { opacity: 0.45 },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  agentEmoji: { fontSize: 20 },
  agentInfo: { flex: 1 },
  agentName: { fontSize: 14, fontWeight: '700', color: OODA.textPrimary, marginBottom: 2 },
  agentNameActive: { color: OODA.primaryDark },
  agentFocus: { fontSize: 12, color: OODA.textTertiary, lineHeight: 17 },

  // Reviewer
  reviewerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: OODA.primaryGlowStrong,
    padding: 14,
  },
  alwaysOnBadge: {
    backgroundColor: OODA.primaryGlow,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  alwaysOnText: { fontSize: 11, fontWeight: '700', color: OODA.primaryDark },

  // Info box
  infoBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: OODA.bgSurface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 14,
    alignItems: 'flex-start',
  },
  infoIcon: { fontSize: 14, color: OODA.textTertiary, marginTop: 1 },
  infoText: { flex: 1, fontSize: 12, color: OODA.textTertiary, lineHeight: 19 },
});
