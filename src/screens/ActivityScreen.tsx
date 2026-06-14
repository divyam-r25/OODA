// ─────────────────────────────────────────────
// OODA — Activity Screen (replaces Signals)
// Plain-English competitor activity timeline
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { loadActivityLogs } from '@/store/storage';
import type { ActivityLog } from '@/types';

type Filter = 'all' | 'high' | 'medium' | 'low';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high', label: 'Signals' },
  { id: 'medium', label: 'Updates' },
  { id: 'low', label: 'FYI' },
];

const PRIORITY_COLOR: Record<string, string> = {
  signal_created: '#E05A00',
  report_generated: OODA.success,
  report_updated: OODA.warning,
  discussion_completed: OODA.primary,
};

function ActivityCard({ item, index }: { item: ActivityLog; index: number }) {
  const color = PRIORITY_COLOR[item.type] || OODA.success;
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(450).springify()}
      style={[styles.card, { borderLeftColor: color }]}
    >
      <View style={styles.cardTop}>
        <Text style={styles.competitor}>{item.title}</Text>
        <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.action}>
        <Text style={styles.actionVerb}>{item.description}</Text>
      </Text>
    </Animated.View>
  );
}

export function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('all');
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  React.useEffect(() => {
    loadActivityLogs().then(setLogs);
  }, []);

  const filtered = filter === 'all'
    ? logs
    : logs.filter((a) => {
        if (filter === 'high') return a.type === 'signal_created';
        if (filter === 'medium') return a.type === 'report_updated' || a.type === 'discussion_completed';
        return a.type === 'report_generated';
      });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Competitor Activity</Text>
        <Text style={styles.subtitle}>What your competitors have been up to</Text>
      </View>

      {/* Filter chips */}
      <View style={styles.filtersRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            onPress={() => setFilter(f.id)}
            style={[styles.chip, filter === f.id && styles.chipActive]}
            activeOpacity={0.75}
          >
            <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <ActivityCard item={item} index={index} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: TAB_BAR_HEIGHT + 24, paddingTop: 8, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyTitle}>All quiet!</Text>
            <Text style={styles.emptyText}>No notable activity from your competitors right now.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12, gap: 4 },
  title: { fontSize: 26, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: OODA.textTertiary, fontWeight: '500' },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: OODA.border,
    backgroundColor: OODA.card,
  },
  chipActive: { backgroundColor: OODA.primary, borderColor: OODA.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: OODA.textSecondary },
  chipTextActive: { color: OODA.textInverse },
  card: {
    backgroundColor: OODA.card,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: OODA.border,
    borderLeftWidth: 3,
    gap: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardUnread: { backgroundColor: '#FAFFF8', borderColor: OODA.primaryGlowStrong },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  competitor: { fontSize: 12, fontWeight: '700', color: OODA.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
  timestamp: { fontSize: 12, color: OODA.textMuted, fontWeight: '500' },
  action: { fontSize: 15, color: OODA.textPrimary, lineHeight: 21, fontWeight: '500' },
  actionVerb: { color: OODA.textSecondary, fontWeight: '400' },
  detail: { fontSize: 13, color: OODA.textTertiary, lineHeight: 19 },
  newBadge: {
    alignSelf: 'flex-start',
    backgroundColor: OODA.primaryGlow,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  newBadgeText: { fontSize: 10, fontWeight: '800', color: OODA.primary, letterSpacing: 0.8 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: OODA.textPrimary },
  emptyText: { fontSize: 14, color: OODA.textTertiary, textAlign: 'center', lineHeight: 21, paddingHorizontal: 20 },
});
