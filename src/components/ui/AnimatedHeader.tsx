// ─────────────────────────────────────────────
// OODA — AnimatedHeader Component
// Screen title with fade + slide entrance animation
// ─────────────────────────────────────────────

import React from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { OODA } from '@/constants/theme';

interface AnimatedHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  rightContent?: React.ReactNode;
}

export function AnimatedHeader({
  title,
  subtitle,
  badge,
  style,
  titleStyle,
  rightContent,
}: AnimatedHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.left}>
        {badge && (
          <View style={styles.badgeRow}>
            <View style={styles.badgeDot} />
            <Text style={styles.badge}>{badge}</Text>
          </View>
        )}
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </Animated.View>
      {rightContent && (
        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()}>
          {rightContent}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  left: {
    flex: 1,
    gap: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OODA.success,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: OODA.success,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: OODA.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: OODA.textSecondary,
    marginTop: 2,
  },
});
