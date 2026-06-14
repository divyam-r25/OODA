// ─────────────────────────────────────────────
// OODA — SectionHeader Component
// ─────────────────────────────────────────────

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { OODA } from '@/constants/theme';

interface SectionHeaderProps {
  title: string;
  action?: string;
  onAction?: () => void;
  accent?: string;
}

export function SectionHeader({ title, action, onAction, accent }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {accent && <View style={[styles.accent, { backgroundColor: accent }]} />}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action && (
        <TouchableOpacity onPress={onAction} activeOpacity={0.7}>
          <Text style={styles.action}>{action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  accent: {
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: OODA.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
    color: OODA.primary,
    letterSpacing: 0.2,
  },
});
