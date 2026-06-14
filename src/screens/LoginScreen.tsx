// ─────────────────────────────────────────────
// OODA — Login Screen
// Premium light auth screen with shake animation
// ─────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OODA, Radius } from '@/constants/theme';
import { useAuth } from '@/store/AuthContext';

// ── OODA Brand Logo ───────────────────────────
function OODALogo() {
  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0.4);
  const rotateVal = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.97, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 2200, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    rotateVal.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotateVal.value * 360}deg` }],
  }));

  return (
    <Animated.View entering={FadeIn.duration(800)} style={styles.logoContainer}>
      {/* Outer glow */}
      <Animated.View style={[styles.outerGlow, glowStyle]} />
      {/* Rotating ring */}
      <Animated.View style={[styles.rotatingRing, ringStyle]} />
      {/* Main diamond */}
      <Animated.View style={[styles.diamond, logoStyle]}>
        <View style={styles.diamondInner} />
        {/* Inner grid lines */}
        <View style={styles.gridH} />
        <View style={styles.gridV} />
      </Animated.View>
    </Animated.View>
  );
}

// ── Login Screen ──────────────────────────────
export function LoginScreen() {
  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<'user' | 'pass' | null>(null);

  const shakeX = useSharedValue(0);
  const formOpacity = useSharedValue(1);
  const passwordRef = useRef<TextInput>(null);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  function triggerShake() {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 55 }),
      withTiming(12, { duration: 55 }),
      withTiming(-9, { duration: 55 }),
      withTiming(9, { duration: 55 }),
      withTiming(-5, { duration: 55 }),
      withTiming(5, { duration: 55 }),
      withTiming(0, { duration: 55 })
    );
  }

  async function handleLogin() {
    if (!username.trim() || !password) {
      setError('Please enter your credentials');
      triggerShake();
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const success = await login(username.trim(), password);
    if (!success) {
      setLoading(false);
      setError('Invalid credentials. Please try again.');
      triggerShake();
    }
    // On success, parent re-renders (isAuthenticated = true)
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.screen}
    >
      {/* Background layers */}
      <View style={styles.bgGlow1} />
      <View style={styles.bgGlow2} />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.brand}>
          <OODALogo />
          <Text style={styles.brandName}>OODA</Text>
          <Text style={styles.brandTagline}>Intelligence Platform</Text>
          <View style={styles.classifiedBadge}>
            <View style={styles.classifiedDot} />
            <Text style={styles.classifiedText}>COMMANDER ACCESS</Text>
          </View>
        </Animated.View>

        {/* Card */}
        <Animated.View entering={FadeInDown.delay(200).duration(700).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Secure Login</Text>
          <Text style={styles.cardSubtitle}>
            Enter your credentials to access the OODA command center
          </Text>

          {/* Form */}
          <Animated.View style={[styles.form, shakeStyle]}>
            {/* Username */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === 'user' && styles.inputFocused,
                  error && styles.inputError,
                ]}
              >
                <Text style={styles.inputIcon}>◈</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={(t) => { setUsername(t); setError(''); }}
                  placeholder="Enter username"
                  placeholderTextColor={OODA.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  onFocus={() => setFocused('user')}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PASSWORD</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focused === 'pass' && styles.inputFocused,
                  error && styles.inputError,
                ]}
              >
                <Text style={styles.inputIcon}>⬡</Text>
                <TextInput
                  ref={passwordRef}
                  style={styles.input}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  placeholder="Enter password"
                  placeholderTextColor={OODA.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                  onFocus={() => setFocused('pass')}
                  onBlur={() => setFocused(null)}
                />
                <TouchableOpacity onPress={() => setShowPassword((p) => !p)} style={styles.eyeBtn}>
                  <Text style={styles.eyeIcon}>{showPassword ? '○' : '●'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Error */}
            {!!error && (
              <Animated.View entering={FadeIn.duration(250)} style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠</Text>
                <Text style={styles.errorText}>{error}</Text>
              </Animated.View>
            )}

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
            >
              <View style={styles.loginBtnInner}>
                {loading ? (
                  <Text style={styles.loginBtnText}>AUTHENTICATING...</Text>
                ) : (
                  <>
                    <Text style={styles.loginBtnText}>ACCESS COMMAND CENTER</Text>
                    <Text style={styles.loginBtnArrow}>→</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Footer */}
        <Animated.Text
          entering={FadeInDown.delay(400).duration(700)}
          style={styles.footer}
        >
          OODA Intelligence v1.0 · Restricted Access
        </Animated.Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: OODA.bgDeep,
  },
  bgGlow1: {
    position: 'absolute',
    top: -100,
    left: '50%',
    marginLeft: -200,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: OODA.primaryGlow,
  },
  bgGlow2: {
    position: 'absolute',
    bottom: 0,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: OODA.secondaryGlow,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 32,
  },
  // ── Logo
  brand: {
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  logoContainer: {
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  outerGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: OODA.primaryGlow,
  },
  rotatingRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: OODA.primaryGlowStrong,
    borderStyle: 'dashed',
  },
  diamond: {
    width: 72,
    height: 72,
    backgroundColor: OODA.primaryGlow,
    borderWidth: 1.5,
    borderColor: OODA.primaryGlowStrong,
    borderRadius: 16,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: OODA.primary,
    shadowOpacity: 0.8,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  diamondInner: {
    width: 28,
    height: 28,
    backgroundColor: OODA.primary,
    borderRadius: 6,
    opacity: 0.7,
  },
  gridH: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: OODA.primaryGlowStrong,
  },
  gridV: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: OODA.primaryGlowStrong,
  },
  brandName: {
    fontSize: 38,
    fontWeight: '800',
    color: OODA.textPrimary,
    letterSpacing: 8,
    textAlign: 'center',
  },
  brandTagline: {
    fontSize: 14,
    color: OODA.textSecondary,
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  classifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: OODA.primaryGlow,
    borderWidth: 1,
    borderColor: OODA.primaryGlowStrong,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  classifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: OODA.primary,
  },
  classifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: OODA.primary,
    letterSpacing: 1.5,
  },
  // ── Card
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: OODA.card,
    borderWidth: 1,
    borderColor: OODA.borderCard,
    borderRadius: Radius.xl,
    padding: 28,
    gap: 20,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: OODA.textPrimary,
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: OODA.textSecondary,
    lineHeight: 20,
    marginTop: -12,
  },
  form: {
    gap: 16,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: OODA.textTertiary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: OODA.bgSurface,
    borderWidth: 1,
    borderColor: OODA.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputFocused: {
    borderColor: OODA.borderFocus,
    backgroundColor: OODA.primaryGlow,
  },
  inputError: {
    borderColor: OODA.dangerGlow,
  },
  inputIcon: {
    fontSize: 16,
    color: OODA.textTertiary,
    width: 20,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: OODA.textPrimary,
    fontWeight: '500',
  },
  eyeBtn: {
    padding: 4,
  },
  eyeIcon: {
    fontSize: 14,
    color: OODA.textTertiary,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: OODA.dangerBg,
    borderWidth: 1,
    borderColor: OODA.dangerGlow,
    borderRadius: Radius.md,
    padding: 12,
  },
  errorIcon: {
    fontSize: 14,
    color: OODA.danger,
  },
  errorText: {
    fontSize: 13,
    color: OODA.dangerLight,
    fontWeight: '500',
    flex: 1,
  },
  loginBtn: {
    borderRadius: Radius.pill,
    overflow: 'hidden',
    marginTop: 4,
    height: 54,
    experimental_backgroundImage: OODA.gradientPrimary,
    shadowColor: OODA.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
  } as any,
  loginBtnInner: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loginBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: OODA.textInverse,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  loginBtnArrow: {
    fontSize: 18,
    color: OODA.textInverse,
    fontWeight: '300',
  },
  footer: {
    fontSize: 11,
    color: OODA.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
