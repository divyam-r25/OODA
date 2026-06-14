// ─────────────────────────────────────────────
// OODA — LoadingSkeleton Component
// Shimmer animation placeholder cards
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { OODA, Radius } from '@/constants/theme';

interface SkeletonLineProps {
  width?: string | number;
  height?: number;
  style?: object;
}

function SkeletonLine({ width = '100%', height = 14, style }: SkeletonLineProps) {
  const shimmer = useSharedValue(0.3);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 800 }),
        withTiming(0.3, { duration: 800 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: OODA.cardElevated,
          borderRadius: Radius.sm,
        },
        animStyle,
        style,
      ]}
    />
  );
}

function SkeletonCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonLine width={80} height={20} />
        <SkeletonLine width={60} height={20} />
      </View>
      <SkeletonLine width="90%" height={14} style={{ marginTop: 12 }} />
      <SkeletonLine width="70%" height={14} style={{ marginTop: 6 }} />
      <SkeletonLine width="40%" height={12} style={{ marginTop: 12 }} />
    </View>
  );
}

interface LoadingSkeletonProps {
  count?: number;
}

export function LoadingSkeleton({ count = 3 }: LoadingSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    backgroundColor: OODA.card,
    borderRadius: Radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: OODA.border,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
