// ─────────────────────────────────────────────
// OODA — Comparison Screen
// Executive-friendly side-by-side comparison
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useCompanyProfile, useCompetitors } from '@/hooks/useOODA';
import { loadReports } from '@/store/storage';
import type { Report } from '@/types';

export interface ComparisonPoint {
  category: string;
  ourValue: string | string[];
  theirValue: string | string[];
  status: string; // plain-English verdict
  statusType: 'advantage' | 'neutral' | 'disadvantage';
}

// ── Competitor Dropdown ───────────────────────
function CompetitorDropdown({
  selected,
  options,
  onSelect,
}: {
  selected: string;
  options: string[];
  onSelect: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const arrowRotate = useSharedValue(0);

  function toggle() {
    setOpen((v) => !v);
    arrowRotate.value = withSpring(open ? 0 : 1, { damping: 14, stiffness: 200 });
  }

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${arrowRotate.value * 180}deg` }],
  }));

  return (
    <View style={dd.wrapper}>
      <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={dd.trigger}>
        <View style={dd.triggerLeft}>
          <Text style={dd.triggerLabel}>Comparing with</Text>
          <Text style={dd.triggerValue}>{selected}</Text>
        </View>
        <Animated.Text style={[dd.arrow, arrowStyle]}>▾</Animated.Text>
      </TouchableOpacity>

      {open && (
        <Animated.View entering={FadeIn.duration(200)} style={dd.menu}>
          {options.map((name) => (
            <TouchableOpacity
              key={name}
              onPress={() => { onSelect(name); setOpen(false); arrowRotate.value = withTiming(0); }}
              style={[dd.option, name === selected && dd.optionActive]}
              activeOpacity={0.75}
            >
              <View style={[dd.optionDot, name === selected && dd.optionDotActive]} />
              <Text style={[dd.optionText, name === selected && dd.optionTextActive]}>{name}</Text>
              {name === selected && <Text style={dd.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const dd = StyleSheet.create({
  wrapper: { zIndex: 100 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  triggerLeft: { gap: 2 },
  triggerLabel: { fontSize: 11, fontWeight: '600', color: OODA.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  triggerValue: { fontSize: 18, fontWeight: '700', color: OODA.textPrimary },
  arrow: { fontSize: 18, color: OODA.textTertiary, fontWeight: '400' },
  menu: {
    marginTop: 6,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: OODA.border,
  },
  optionActive: { backgroundColor: OODA.primaryGlow },
  optionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OODA.border },
  optionDotActive: { backgroundColor: OODA.primary },
  optionText: { flex: 1, fontSize: 15, fontWeight: '600', color: OODA.textSecondary },
  optionTextActive: { color: OODA.primaryDark },
  checkmark: { fontSize: 14, color: OODA.primary, fontWeight: '700' },
});

// ── Comparison Card ───────────────────────────
const STATUS_STYLES = {
  advantage: { bg: OODA.successBg, border: OODA.success, text: OODA.success, icon: '↑' },
  neutral: { bg: 'rgba(107,114,128,0.08)', border: '#D1D5DB', text: OODA.textTertiary, icon: '→' },
  disadvantage: { bg: OODA.warningBg, border: OODA.warning, text: '#B45309', icon: '↓' },
};

function ComparisonCard({
  point,
  ourName,
  theirName,
  index,
}: {
  point: ComparisonPoint;
  ourName: string;
  theirName: string;
  index: number;
}) {
  const st = STATUS_STYLES[point.statusType];
  const isArray = (v: string | string[]) => Array.isArray(v);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(500).springify()}
      style={cc.card}
    >
      <Text style={cc.category}>{point.category}</Text>

      {/* Side by side */}
      <View style={cc.sideRow}>
        {/* Our side */}
        <View style={[cc.side, cc.ourSide]}>
          <Text style={cc.sideLabel}>You</Text>
          {isArray(point.ourValue) ? (
            (point.ourValue as string[]).map((v) => (
              <View key={v} style={cc.featureRow}>
                <View style={cc.featureDot} />
                <Text style={cc.featureText}>{v}</Text>
              </View>
            ))
          ) : (
            <Text style={cc.sideValue}>{point.ourValue as string}</Text>
          )}
        </View>

        <View style={cc.divider} />

        {/* Their side */}
        <View style={cc.side}>
          <Text style={cc.sideLabel}>{theirName}</Text>
          {isArray(point.theirValue) ? (
            (point.theirValue as string[]).map((v) => (
              <View key={v} style={cc.featureRow}>
                <View style={[cc.featureDot, { backgroundColor: OODA.textMuted }]} />
                <Text style={cc.featureTextMuted}>{v}</Text>
              </View>
            ))
          ) : (
            <Text style={cc.sideValueMuted}>{point.theirValue as string}</Text>
          )}
        </View>
      </View>

      {/* Verdict */}
      <View style={[cc.status, { backgroundColor: st.bg, borderColor: st.border }]}>
        <Text style={[cc.statusIcon, { color: st.text }]}>{st.icon}</Text>
        <Text style={[cc.statusText, { color: st.text }]}>{point.status}</Text>
      </View>
    </Animated.View>
  );
}

const cc = StyleSheet.create({
  card: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 20,
    gap: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  category: { fontSize: 13, fontWeight: '700', color: OODA.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  sideRow: { flexDirection: 'row', gap: 0 },
  side: { flex: 1, gap: 8, paddingHorizontal: 4 },
  ourSide: { paddingRight: 12 },
  sideLabel: { fontSize: 11, fontWeight: '700', color: OODA.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  sideValue: { fontSize: 16, fontWeight: '700', color: OODA.textPrimary },
  sideValueMuted: { fontSize: 16, fontWeight: '700', color: OODA.textSecondary },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: OODA.primary, flexShrink: 0 },
  featureText: { fontSize: 13, color: OODA.textPrimary, fontWeight: '500' },
  featureTextMuted: { fontSize: 13, color: OODA.textSecondary, fontWeight: '500' },
  divider: { width: 1, backgroundColor: OODA.border, marginHorizontal: 4 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusIcon: { fontSize: 14, fontWeight: '700' },
  statusText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },
});

// ── AI Insight Card ───────────────────────────
function AIInsightCard({ insight, index }: { insight: string; index: number }) {
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(500).springify()}
      style={ai.card}
    >
      <View style={ai.header}>
        <View style={ai.iconWrap}>
          <Text style={{ fontSize: 16 }}>✦</Text>
        </View>
        <Text style={ai.title}>OODA's Take</Text>
      </View>
      <Text style={ai.text}>{insight}</Text>
    </Animated.View>
  );
}

const ai = StyleSheet.create({
  card: {
    backgroundColor: OODA.primary,
    borderRadius: Radius.xl,
    padding: 20,
    gap: 12,
    shadowColor: OODA.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.8 },
  text: { fontSize: 15, color: OODA.textInverse, lineHeight: 23, fontWeight: '500' },
});

// ── Empty State ───────────────────────────────
function EmptyState() {
  return (
    <Animated.View entering={FadeIn.duration(500)} style={empty.wrap}>
      <Text style={empty.icon}>🔍</Text>
      <Text style={empty.title}>No competitors added yet</Text>
      <Text style={empty.sub}>
        Add competitors during setup or from your Profile, and OODA will generate a comparison here.
      </Text>
      <TouchableOpacity style={empty.btn} activeOpacity={0.85}>
        <Text style={empty.btnText}>Add Competitor</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const empty = StyleSheet.create({
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

// ── Comparison Screen ─────────────────────────
export function ComparisonScreen() {
  const insets = useSafeAreaInsets();
  const company = useCompanyProfile();
  const competitors = useCompetitors();
  
  const [reports, setReports] = useState<Record<string, Report>>({});

  React.useEffect(() => {
    loadReports().then(setReports);
  }, []);

  const [selectedId, setSelectedId] = useState<string>(
    competitors[0]?.id ?? ''
  );

  const competitorOptions = competitors.map((c) => c.name);
  const selectedCompetitor = competitors.find(c => c.name === selectedId || c.id === selectedId);
  
  // Actually selectedName might be selectedId depending on the dropdown
  const handleSelect = (name: string) => {
    const comp = competitors.find(c => c.name === name);
    if (comp) setSelectedId(comp.id);
  };

  const selectedName = selectedCompetitor?.name ?? '';

  if (competitors.length === 0) {
    return (
      <View style={[sc.screen, { paddingTop: insets.top }]}>
        <View style={sc.header}>
          <Text style={sc.title}>Comparison</Text>
          <Text style={sc.subtitle}>See how you stack up against competitors</Text>
        </View>
        <EmptyState />
      </View>
    );
  }

  // Build dynamic comparison data from reports
  const ourReport = reports['own'];
  const theirReport = reports[selectedId];

  let points: ComparisonPoint[] = [];
  let aiInsight = 'Reports are currently generating. Check back later.';

  if (ourReport && theirReport) {
    points = [
      {
        category: 'Pricing',
        ourValue: ourReport.pricing,
        theirValue: theirReport.pricing,
        status: 'Pricing strategy comparison',
        statusType: 'neutral'
      },
      {
        category: 'Features',
        ourValue: ourReport.features,
        theirValue: theirReport.features,
        status: 'Core feature set comparison',
        statusType: 'neutral'
      },
      {
        category: 'Positioning',
        ourValue: ourReport.positioning,
        theirValue: theirReport.positioning,
        status: 'Target audience and market placement',
        statusType: 'neutral'
      },
      {
        category: 'Strengths',
        ourValue: ourReport.strengths,
        theirValue: theirReport.strengths,
        status: 'Observe their advantages',
        statusType: 'neutral'
      }
    ];

    // Inject dynamic custom points extracted by AI
    if (theirReport.customData && Object.keys(theirReport.customData).length > 0) {
      Object.entries(theirReport.customData).forEach(([key, theirVal]) => {
        // Only add if it's not a generic key we already have
        if (!['pricing', 'features', 'positioning', 'strengths'].includes(key.toLowerCase())) {
          points.push({
            category: key,
            ourValue: ourReport.customData?.[key] || 'Not specified',
            theirValue: theirVal,
            status: 'Dynamic insight extracted from data',
            statusType: 'neutral'
          });
        }
      });
    }

    aiInsight = theirReport.recommendations || theirReport.summary;
  } else if (!ourReport && !theirReport) {
    aiInsight = 'Data is currently being gathered for both you and this competitor.';
  } else if (!theirReport) {
    aiInsight = 'Waiting for competitor data to finish processing...';
  }

  return (
    <View style={[sc.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(450).springify()} style={sc.header}>
        <Text style={sc.title}>Comparison</Text>
        <Text style={sc.subtitle}>
          {company?.name ?? 'Your Company'} vs the market
        </Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[sc.content, { paddingBottom: TAB_BAR_HEIGHT + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Dropdown */}
        <Animated.View entering={FadeInDown.delay(80).duration(450).springify()}>
          <CompetitorDropdown
            selected={selectedName}
            options={competitorOptions}
            onSelect={handleSelect}
          />
        </Animated.View>

        {/* Comparison Cards */}
        <Animated.View
          key={selectedId}
          entering={FadeIn.duration(300)}
          style={sc.cards}
        >
          {points.map((point, i) => (
            <ComparisonCard
              key={point.category}
              point={point}
              ourName={company?.name ?? 'You'}
              theirName={selectedName}
              index={i}
            />
          ))}

          {/* AI Insight */}
          <AIInsightCard insight={aiInsight} index={points.length} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const sc = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 4 },
  title: { fontSize: 26, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: OODA.textTertiary, fontWeight: '500' },
  content: { paddingHorizontal: 20, paddingTop: 4, gap: 14 },
  cards: { gap: 14 },
});
