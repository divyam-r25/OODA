// ─────────────────────────────────────────────
// OODA — Dashboard Screen (Client-Centric)
// Plain English summaries. No metrics.
// ─────────────────────────────────────────────

import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useCompany } from '@/store/CompanyContext';
import { useModelsConfig } from '@/hooks/useModelsConfig';
import { engine } from '@/services/execution/ExecutionEngine';
import type { ActivityPriority, Signal, ActivityLog, Report } from '@/types';
import { loadSignals, loadActivityLogs, loadReports } from '@/store/storage';
import { SignalService } from '@/services/SignalService';
import { PipelineState, usePipelineStoreState } from '@/store/PipelineStore';

// ── Greeting ──────────────────────────────────
function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Priority Badge ────────────────────────────
const PRIORITY_CONFIG: Record<ActivityPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'LOW', color: OODA.success, bg: OODA.successBg },
  medium: { label: 'MEDIUM', color: OODA.warning, bg: OODA.warningBg },
  high: { label: 'HIGH', color: '#E05A00', bg: 'rgba(224,90,0,0.1)' },
  critical: { label: 'CRITICAL', color: OODA.danger, bg: OODA.dangerBg },
};

function PriorityBadge({ priority }: { priority: ActivityPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return (
    <View style={[badge.container, { backgroundColor: cfg.bg }]}>
      <View style={[badge.dot, { backgroundColor: cfg.color }]} />
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});

// ── Dashboard Screen ──────────────────────────
export function DashboardScreen({ onStartDiscussion }: { onStartDiscussion?: () => void }) {
  const insets = useSafeAreaInsets();
  const { company, competitors } = useCompany();
  const config = useModelsConfig();
  
  const [signals, setSignals] = React.useState<Signal[]>([]);
  const [logs, setLogs] = React.useState<ActivityLog[]>([]);
  const [reports, setReports] = React.useState<Record<string, Report>>({});

  React.useEffect(() => {
    // Load dashboard data
    Promise.all([loadSignals(), loadActivityLogs(), loadReports()])
      .then(([s, l, r]) => {
        setSignals(s);
        setLogs(l);
        setReports(r);
      });
  }, []);

  const latestSignal = signals.length > 0 ? signals[0] : null;
  const unreadLogs = logs.slice(0, 3); // For dashboard preview
  
  const { status: pipelineState, message: pipelineMsg, debugStats: pipelineStats } = usePipelineStoreState();
  
  const isGenerating = pipelineState !== PipelineState.IDLE && pipelineState !== PipelineState.COMPLETED && pipelineState !== PipelineState.FAILED;
  
  const isIdleWithoutReports = pipelineState === PipelineState.IDLE && company && competitors.length > 0 && Object.keys(reports).length === 0;
  const isCompletedWithoutReports = (pipelineState === PipelineState.COMPLETED || pipelineState === PipelineState.FAILED) && company && competitors.length > 0 && Object.keys(reports).length === 0;
  
  const isActiveOrFallback = isGenerating || isIdleWithoutReports;

  async function handleStartDiscussion() {
    if (!config.manualSignal.trim()) return;
    const signalText = config.manualSignal;
    // Clear input
    config.setManualSignal('');
    
    // Create manual signal and run
    const signal = await SignalService.createManualSignal(signalText);
    engine.run(signal.description, signal);
    
    if (onStartDiscussion) onStartDiscussion();
  }

  return (
    <KeyboardAvoidingView 
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_HEIGHT + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting */}
      <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.greetRow}>
        <View>
          <Text style={styles.greetText}>{greeting()}</Text>
          <Text style={styles.greetName}>
            {company ? `Monitoring ${company.name}` : 'Welcome to OODA'}
          </Text>
          {competitors.length > 0 && (
            <Text style={styles.greetSub}>
              Watching {competitors.length} competitor{competitors.length !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {company?.name?.charAt(0)?.toUpperCase() ?? 'O'}
          </Text>
        </View>
      </Animated.View>

      {/* Today's Summary Hero Card */}
      <Animated.View entering={FadeInDown.delay(100).duration(600).springify()} style={styles.heroCard}>
        {isActiveOrFallback ? (
          <>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>PIPELINE STATUS</Text>
            </View>
            <Text style={styles.heroHeadline}>
              {isGenerating ? pipelineState : 'Generating initial baseline intelligence...'}
            </Text>
            <Text style={styles.recommendText}>
              {isGenerating ? pipelineMsg : `The scraper is analyzing ${competitors.length + 1} websites. This may take a few moments.`}
            </Text>
          </>
        ) : isCompletedWithoutReports ? (
          <>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>PIPELINE FAILED</Text>
              <PriorityBadge priority="high" />
            </View>
            <Text style={styles.heroHeadline}>Failed to generate baseline intelligence.</Text>
            <Text style={styles.recommendText}>The scraper or Ollama model might be offline or unreachable. Please check your backend connection and try again.</Text>
            
            <TouchableOpacity 
              style={{ marginTop: 12, backgroundColor: OODA.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: Radius.md, alignSelf: 'flex-start' }}
              onPress={() => {
                import('@/services/IntelligencePipeline').then(m => m.IntelligencePipeline.runInitialOnboarding()).catch(console.error);
              }}
            >
              <Text style={{ color: OODA.textInverse, fontWeight: '700', fontSize: 13 }}>Retry Pipeline</Text>
            </TouchableOpacity>
          </>
        ) : latestSignal ? (
          <>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>LATEST SIGNAL</Text>
              <PriorityBadge priority={latestSignal.severity} />
            </View>
            <Text style={styles.heroHeadline}>{latestSignal.competitorName} updated {latestSignal.type.toLowerCase()}</Text>
            <View style={styles.heroDivider} />
            <View style={styles.recommendRow}>
              <View style={styles.recommendIcon}><Text style={{ fontSize: 16 }}>💡</Text></View>
              <Text style={styles.recommendText} numberOfLines={3}>{latestSignal.description}</Text>
            </View>
          </>
        ) : (
          <>
             <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>TODAY'S SUMMARY</Text>
              <PriorityBadge priority="low" />
            </View>
            <Text style={styles.heroHeadline}>Everything is stable today.</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.recommendText}>No significant changes detected across your competitors since the last scrape.</Text>
          </>
        )}
      </Animated.View>

      {/* Debug Panel (Only in Dev Mode) */}
      {__DEV__ && pipelineStats && (
        <Animated.View entering={FadeInDown.delay(150).duration(600).springify()} style={styles.debugCard}>
          <Text style={styles.debugTitle}>RAG Layer Debug</Text>
          <View style={styles.debugRow}><Text style={styles.debugLabel}>Company:</Text><Text style={styles.debugVal}>{pipelineStats.companyName}</Text></View>
          <View style={styles.debugRow}><Text style={styles.debugLabel}>Raw Size:</Text><Text style={styles.debugVal}>{pipelineStats.responseSizeKB} KB</Text></View>
          <View style={styles.debugRow}><Text style={styles.debugLabel}>Chunks Created:</Text><Text style={styles.debugVal}>{pipelineStats.chunksCreated}</Text></View>
          <View style={styles.debugRow}><Text style={styles.debugLabel}>Chunks Retrieved:</Text><Text style={styles.debugVal}>{pipelineStats.chunksRetrieved}</Text></View>
          <View style={styles.debugRow}><Text style={styles.debugLabel}>Est. Tokens Sent:</Text><Text style={styles.debugVal}>~{pipelineStats.tokensSent}</Text></View>
          <View style={styles.debugRow}><Text style={styles.debugLabel}>Processing Time:</Text><Text style={styles.debugVal}>{pipelineStats.processingTimeSec}s</Text></View>
        </Animated.View>
      )}

      {/* Recent Activity Preview */}
      <Animated.View entering={FadeInDown.delay(200).duration(600).springify()} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {logs.length > 0 && (
            <View style={styles.unreadPill}>
              <Text style={styles.unreadText}>{logs.length} total</Text>
            </View>
          )}
        </View>

        {logs.length === 0 && !isGenerating && (
           <Text style={{color: OODA.textMuted, fontSize: 14, fontStyle: 'italic', paddingHorizontal: 4}}>No recent activity.</Text>
        )}

        <View style={styles.activityList}>
          {unreadLogs.map((item, i) => {
            const priority: ActivityPriority = item.type === 'signal_created' ? 'high' : 'low';
            const cfg = PRIORITY_CONFIG[priority];
            return (
              <Animated.View
                key={item.id}
                entering={FadeInDown.delay(300 + i * 80).duration(500).springify()}
                style={[styles.activityRow]}
              >
                <View style={[styles.activityDot, { backgroundColor: cfg.color }]} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>
                    <Text style={styles.activityCompetitor}>{item.title}</Text>
                  </Text>
                  <Text style={styles.recommendText} numberOfLines={1}>{item.description}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </Animated.View>

      {/* AI Manual Signal Card */}
      <Animated.View entering={FadeInDown.delay(400).duration(600).springify()} style={styles.signalCard}>
        <Text style={styles.signalTitle}>Queue a Competitive Signal</Text>
        <TextInput
          style={styles.signalInput}
          placeholder="e.g. Rival just dropped their pricing by 20%..."
          placeholderTextColor={OODA.textMuted}
          value={config.manualSignal}
          onChangeText={config.setManualSignal}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={styles.signalBtn}
          onPress={handleStartDiscussion}
          activeOpacity={0.8}
        >
          <Text style={styles.signalBtnText}>Analyze Signal with AI</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  content: { paddingHorizontal: 20, gap: 20 },

  // Greeting
  greetRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  greetText: { fontSize: 15, color: OODA.textTertiary, fontWeight: '500', marginBottom: 3 },
  greetName: { fontSize: 24, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.4 },
  greetSub: { fontSize: 13, color: OODA.textTertiary, marginTop: 3 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: OODA.primary, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: OODA.textInverse },

  // Hero Card
  heroCard: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: OODA.border,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroLabel: { fontSize: 11, fontWeight: '700', color: OODA.textTertiary, letterSpacing: 1 },
  heroHeadline: { fontSize: 24, fontWeight: '800', color: OODA.textPrimary, letterSpacing: -0.5, lineHeight: 28 },
  heroDivider: { height: 1, backgroundColor: OODA.border },
  
  // Debug Card
  debugCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  debugTitle: { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 4, textTransform: 'uppercase' },
  debugRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  debugLabel: { fontSize: 13, color: '#AAA' },
  debugVal: { fontSize: 13, color: '#4AF626', fontWeight: '600' },

  recommendRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  recommendIcon: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: OODA.primaryGlow, justifyContent: 'center', alignItems: 'center',
  },
  recommendText: { flex: 1, fontSize: 14, color: OODA.textSecondary, lineHeight: 20 },

  // Activity
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: OODA.textPrimary },
  unreadPill: {
    backgroundColor: OODA.primaryGlow, borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  unreadText: { fontSize: 12, fontWeight: '700', color: OODA.primary },
  activityList: { gap: 8 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: OODA.card,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: OODA.border,
  },
  activityUnread: { borderColor: OODA.primaryGlowStrong, backgroundColor: OODA.primaryGlow },
  activityDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 2 },
  activityContent: { flex: 1, gap: 3 },
  activityText: { fontSize: 14, color: OODA.textSecondary, lineHeight: 19 },
  activityCompetitor: { fontWeight: '700', color: OODA.textPrimary },
  activityTime: { fontSize: 12, color: OODA.textTertiary, fontWeight: '500' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OODA.primary, flexShrink: 0 },

  // Signal Card
  signalCard: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: OODA.border,
    gap: 12,
  },
  signalTitle: { fontSize: 16, fontWeight: '700', color: OODA.textPrimary },
  signalInput: {
    backgroundColor: OODA.bg,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 14,
    color: OODA.textPrimary,
    minHeight: 80,
    borderWidth: 1,
    borderColor: OODA.border,
    textAlignVertical: 'top',
  },
  signalBtn: {
    backgroundColor: OODA.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  signalBtnText: { fontSize: 14, fontWeight: '700', color: OODA.textInverse },
});
