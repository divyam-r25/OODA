// ─────────────────────────────────────────────
// OODA — GlassCard Component
// Simulates glassmorphism with semi-transparent bg
// ─────────────────────────────────────────────

import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';

import { OODA, Radius } from '@/constants/theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  glowColor?: string;
  variant?: 'default' | 'elevated' | 'flat';
  noPadding?: boolean;
}

export function GlassCard({
  children,
  style,
  glowColor,
  variant = 'default',
  noPadding = false,
}: GlassCardProps) {
  const cardStyle: ViewStyle = {
    backgroundColor:
      variant === 'elevated'
        ? OODA.cardElevated
        : variant === 'flat'
          ? OODA.cardGlass
          : OODA.card,
    borderWidth: 1,
    borderColor: variant === 'flat' ? OODA.borderSubtle : OODA.borderCard,
    borderRadius: Radius.lg,
    padding: noPadding ? 0 : 16,
    overflow: 'hidden',
    ...(glowColor
      ? {
          shadowColor: glowColor,
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 10,
        }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }),
  };

  return (
    <View style={[styles.base, cardStyle, style]}>
      {/* Subtle top highlight for depth */}
      <View style={styles.topHighlight} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 1,
  },
});
