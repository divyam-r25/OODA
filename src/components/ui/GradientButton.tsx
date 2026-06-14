// ─────────────────────────────────────────────
// OODA — GradientButton Component
// Premium animated gradient CTA button
// ─────────────────────────────────────────────

import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { OODA, Radius } from '@/constants/theme';

interface GradientButtonProps {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const VARIANT_GRADIENTS: Record<string, string> = {
  primary: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
  secondary: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)',
  danger: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
};

const SIZES = {
  sm: { paddingVertical: 10, paddingHorizontal: 16, fontSize: 13, height: 40 },
  md: { paddingVertical: 14, paddingHorizontal: 24, fontSize: 15, height: 50 },
  lg: { paddingVertical: 18, paddingHorizontal: 32, fontSize: 16, height: 58 },
};

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function GradientButton({
  label,
  onPress,
  style,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
}: GradientButtonProps) {
  const scale = useSharedValue(1);
  const sizeConfig = SIZES[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  if (variant === 'ghost') {
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.ghostButton,
          {
            paddingVertical: sizeConfig.paddingVertical,
            paddingHorizontal: sizeConfig.paddingHorizontal,
            height: sizeConfig.height,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          animatedStyle,
          style,
        ]}
        activeOpacity={1}
      >
        <Text style={[styles.label, { fontSize: sizeConfig.fontSize, color: OODA.primary }]}>
          {label}
        </Text>
      </AnimatedTouchable>
    );
  }

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.button,
        {
          experimental_backgroundImage: VARIANT_GRADIENTS[variant],
          paddingVertical: sizeConfig.paddingVertical,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          height: sizeConfig.height,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
          shadowColor: variant === 'primary' ? OODA.primary : variant === 'secondary' ? OODA.secondary : OODA.danger,
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        } as any,
        animatedStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <Text style={[styles.label, { fontSize: sizeConfig.fontSize }]}>{label}</Text>
      )}
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ghostButton: {
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: OODA.borderFocus,
    backgroundColor: OODA.primaryGlow,
  },
  label: {
    color: OODA.textInverse,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
