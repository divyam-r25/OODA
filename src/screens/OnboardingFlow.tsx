// ─────────────────────────────────────────────
// OODA — Onboarding Flow (2 Steps)
// Step 1: Company Info | Step 2: AI Competitor Discovery
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
  FadeIn,
  FadeInDown,
  FadeInRight,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OODA, Radius } from '@/constants/theme';
import { useCompany } from '@/store/CompanyContext';
import type { Competitor, CompanyProfile } from '@/types';

// ── Progress Bar ──────────────────────────────
function ProgressBar({ step }: { step: 1 | 2 }) {
  const fillAnim = useSharedValue(step === 1 ? 0.5 : 1);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fillAnim.value * 100}%`,
  }));

  return (
    <View style={progress.container}>
      <View style={progress.track}>
        <Animated.View style={[progress.fill, fillStyle]} />
      </View>
      <View style={progress.stepsRow}>
        {[1, 2].map((s) => (
          <View key={s} style={progress.stepItem}>
            <View
              style={[
                progress.dot,
                s <= step ? progress.dotActive : progress.dotInactive,
              ]}
            >
              <Text
                style={[
                  progress.dotText,
                  s <= step ? progress.dotTextActive : progress.dotTextInactive,
                ]}
              >
                {s < step ? '✓' : String(s)}
              </Text>
            </View>
            <Text style={[progress.label, s <= step && progress.labelActive]}>
              {s === 1 ? 'Your Company' : 'Competitors'}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const progress = StyleSheet.create({
  container: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  track: {
    height: 4,
    backgroundColor: OODA.border,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: OODA.primary, borderRadius: Radius.pill },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', gap: 4 },
  dot: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  dotActive: { backgroundColor: OODA.primary },
  dotInactive: { backgroundColor: OODA.border },
  dotText: { fontSize: 12, fontWeight: '700' },
  dotTextActive: { color: OODA.textInverse },
  dotTextInactive: { color: OODA.textTertiary },
  label: { fontSize: 11, color: OODA.textTertiary, fontWeight: '500' },
  labelActive: { color: OODA.primary, fontWeight: '700' },
});

// ── Input Field ───────────────────────────────
interface FieldProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  multiline?: boolean;
  keyboardType?: 'default' | 'url' | 'email-address';
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  required,
  multiline,
  keyboardType = 'default',
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={field.group}>
      <View style={field.labelRow}>
        <Text style={field.label}>{label}</Text>
        {required && <Text style={field.req}>*</Text>}
      </View>
      <TextInput
        style={[field.input, focused && field.inputFocused, multiline && field.inputMulti]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={OODA.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize={keyboardType === 'url' ? 'none' : 'words'}
        autoCorrect={false}
        multiline={multiline}
        keyboardType={keyboardType}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );
}

const field = StyleSheet.create({
  group: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: 13, fontWeight: '600', color: OODA.textSecondary },
  req: { fontSize: 13, fontWeight: '700', color: OODA.danger },
  input: {
    backgroundColor: OODA.bgSurface,
    borderWidth: 1.5,
    borderColor: OODA.border,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: OODA.textPrimary,
    fontWeight: '500',
  },
  inputFocused: { borderColor: OODA.primary, backgroundColor: OODA.primaryGlow },
  inputMulti: { minHeight: 80, textAlignVertical: 'top', paddingTop: 14 },
});

// ─────────────────────────────────────────────
// STEP 1 — Company Information
// ─────────────────────────────────────────────
interface Step1Props {
  onNext: (profile: CompanyProfile) => void;
}

function Step1({ onNext }: Step1Props) {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<CompanyProfile>({
    name: '',
    description: '',
    industry: '',
    location: '',
    website: '',
    targetAudience: '',
    businessType: '',
    primaryGoal: '',
  });
  const [error, setError] = useState('');

  function update(key: keyof CompanyProfile, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError('');
  }

  function handleNext() {
    if (!form.name.trim() || !form.industry.trim() || !form.description.trim()) {
      setError('Please fill in the required fields (marked with *).');
      return;
    }
    onNext(form);
  }

  const INDUSTRY_OPTIONS = ['SaaS', 'E-commerce', 'Healthcare', 'Fintech', 'Education', 'Retail', 'Other'];
  const BUSINESS_TYPES = ['B2B', 'B2C', 'Both', 'Marketplace'];
  const GOALS = ['Grow revenue', 'Expand market share', 'Retain customers', 'Launch new product'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[s1.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <Text style={s1.title}>Tell us about your company</Text>
          <Text style={s1.subtitle}>This helps OODA personalise insights just for you.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).duration(500).springify()} style={s1.formCard}>
          <Field
            label="Company Name"
            placeholder="e.g. OODA CRM"
            value={form.name}
            onChange={(v) => update('name', v)}
            required
          />
          <Field
            label="What does your company do?"
            placeholder="e.g. AI-powered CRM for startups"
            value={form.description}
            onChange={(v) => update('description', v)}
            required
            multiline
          />

          {/* Industry Picker */}
          <View style={field.group}>
            <View style={field.labelRow}>
              <Text style={field.label}>Industry</Text>
              <Text style={field.req}>*</Text>
            </View>
            <View style={s1.chipRow}>
              {INDUSTRY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => update('industry', opt)}
                  style={[s1.chip, form.industry === opt && s1.chipActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[s1.chipText, form.industry === opt && s1.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Field
            label="Location"
            placeholder="e.g. India"
            value={form.location}
            onChange={(v) => update('location', v)}
          />
          <Field
            label="Website"
            placeholder="e.g. https://ooda.ai"
            value={form.website}
            onChange={(v) => update('website', v)}
            keyboardType="url"
          />
          <Field
            label="Who are your customers?"
            placeholder="e.g. Small Businesses, Startups"
            value={form.targetAudience}
            onChange={(v) => update('targetAudience', v)}
          />

          {/* Business Type */}
          <View style={field.group}>
            <Text style={field.label}>Business Type</Text>
            <View style={s1.chipRow}>
              {BUSINESS_TYPES.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => update('businessType', opt)}
                  style={[s1.chip, form.businessType === opt && s1.chipActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[s1.chipText, form.businessType === opt && s1.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Primary Goal */}
          <View style={field.group}>
            <Text style={field.label}>Primary Goal</Text>
            <View style={s1.chipRow}>
              {GOALS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => update('primaryGoal', opt)}
                  style={[s1.chip, form.primaryGoal === opt && s1.chipActive]}
                  activeOpacity={0.75}
                >
                  <Text style={[s1.chipText, form.primaryGoal === opt && s1.chipTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!!error && (
            <Animated.View entering={FadeIn.duration(200)} style={s1.errorBox}>
              <Text style={s1.errorText}>{error}</Text>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[s1.cta, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={s1.nextBtn}>
          <Text style={s1.nextBtnText}>Continue</Text>
          <Text style={s1.nextBtnArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s1 = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  title: { fontSize: 26, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, color: OODA.textSecondary, lineHeight: 22 },
  formCard: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 20,
    gap: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: OODA.border,
    backgroundColor: OODA.bgSurface,
  },
  chipActive: { backgroundColor: OODA.primary, borderColor: OODA.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: OODA.textSecondary },
  chipTextActive: { color: OODA.textInverse },
  errorBox: {
    backgroundColor: OODA.dangerBg,
    borderWidth: 1,
    borderColor: OODA.dangerGlow,
    borderRadius: Radius.md,
    padding: 12,
  },
  errorText: { fontSize: 13, color: OODA.danger, fontWeight: '500' },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: OODA.bg,
    borderTopWidth: 1,
    borderTopColor: OODA.border,
  },
  nextBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    backgroundColor: OODA.primary,
    borderRadius: Radius.pill,
    height: 54,
    shadowColor: OODA.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: OODA.textInverse },
  nextBtnArrow: { fontSize: 18, color: OODA.textInverse },
});

// ─────────────────────────────────────────────
// AI DISCOVERY ANIMATION (between steps)
// ─────────────────────────────────────────────
const DISCOVERY_STEPS = [
  'Understanding your industry',
  'Identifying your market segment',
  'Finding similar businesses',
  'Building your intelligence profile',
];

interface DiscoveryAnimProps {
  onDone: () => void;
}

function DiscoveryAnim({ onDone }: DiscoveryAnimProps) {
  const [doneIndex, setDoneIndex] = useState(-1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.05, { duration: 700 }), withTiming(0.97, { duration: 700 })),
      -1,
      false
    );

    let i = 0;
    const tick = () => {
      setDoneIndex(i);
      i++;
      if (i < DISCOVERY_STEPS.length) {
        setTimeout(tick, 650);
      } else {
        setTimeout(onDone, 600);
      }
    };
    setTimeout(tick, 500);
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={da.screen}>
      <Animated.View style={[da.logoWrap, logoStyle]}>
        <View style={da.logoDiamond}>
          <Text style={da.logoText}>✦</Text>
        </View>
        <View style={[da.logoRing, { opacity: 0.3 }]} />
        <View style={[da.logoRing, { width: 100, height: 100, opacity: 0.15 }]} />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(200).duration(500)} style={da.content}>
        <Text style={da.headline}>Analyzing your business…</Text>
        <Text style={da.sub}>This only takes a moment</Text>

        <View style={da.stepsList}>
          {DISCOVERY_STEPS.map((step, i) => (
            <Animated.View
              key={step}
              entering={FadeInUp.delay(i * 200).duration(400).springify()}
              style={da.stepRow}
            >
              <View style={[da.stepDot, doneIndex >= i ? da.stepDotDone : da.stepDotPending]}>
                {doneIndex >= i && <Text style={da.stepCheck}>✓</Text>}
              </View>
              <Text style={[da.stepText, doneIndex >= i && da.stepTextDone]}>{step}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const da = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg, justifyContent: 'center', alignItems: 'center', gap: 40 },
  logoWrap: { justifyContent: 'center', alignItems: 'center' },
  logoDiamond: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: OODA.primary,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: OODA.primary,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logoText: { fontSize: 28, color: OODA.textInverse, transform: [{ rotate: '-45deg' }] },
  logoRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: OODA.primary,
  },
  content: { gap: 16, alignItems: 'center', paddingHorizontal: 40 },
  headline: { fontSize: 22, fontWeight: '700', color: OODA.textPrimary, textAlign: 'center', letterSpacing: -0.3 },
  sub: { fontSize: 14, color: OODA.textTertiary, textAlign: 'center' },
  stepsList: { gap: 14, marginTop: 8 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  stepDotPending: { backgroundColor: OODA.border },
  stepDotDone: { backgroundColor: OODA.primary },
  stepCheck: { fontSize: 12, fontWeight: '800', color: OODA.textInverse },
  stepText: { fontSize: 14, color: OODA.textMuted, fontWeight: '500' },
  stepTextDone: { color: OODA.textPrimary, fontWeight: '600' },
});

// ─────────────────────────────────────────────
// STEP 2 — Competitor Selection (AI Powered)
// ─────────────────────────────────────────────
interface Step2Props {
  onComplete: (competitors: Competitor[]) => void;
  onBack: () => void;
}

function Step2({ onComplete, onBack }: Step2Props) {
  const insets = useSafeAreaInsets();
  const [manualUrl, setManualUrl] = useState('');
  const [manualList, setManualList] = useState<string[]>([]);
  const [urlError, setUrlError] = useState('');

  function addManual() {
    const url = manualUrl.trim();
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setUrlError('URL must start with https:// or http://');
      return;
    }
    setManualList((prev) => [...prev, url]);
    setManualUrl('');
    setUrlError('');
  }

  function handleFinish() {

    const fromManual = manualList.map((url, i) => ({
      id: `manual-${i}`,
      name: url.replace(/https?:\/\//, '').split('/')[0],
      url,
      addedAt: new Date().toISOString(),
    }));

    onComplete([...fromManual]);
  }

  const totalCount = manualList.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[s2.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <Text style={s2.title}>Your Competitors</Text>
        </Animated.View>

        {/* Manual URL section */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(500).springify()}
          style={s2.manualCard}
        >
          <Text style={s2.manualTitle}>Or add your own source</Text>
          <Text style={s2.manualSub}>
            Paste a competitor's website or a news feed URL you want OODA to monitor.
          </Text>

          <View style={s2.manualRow}>
            <TextInput
              style={[s2.manualInput, urlError ? { borderColor: OODA.danger } : {}]}
              value={manualUrl}
              onChangeText={(v) => { setManualUrl(v); setUrlError(''); }}
              placeholder="https://competitor.com"
              placeholderTextColor={OODA.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TouchableOpacity onPress={addManual} style={s2.addBtn} activeOpacity={0.8}>
              <Text style={s2.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {!!urlError && <Text style={s2.urlError}>{urlError}</Text>}

          {manualList.map((url, i) => (
            <View key={i} style={s2.addedRow}>
              <View style={s2.addedDot} />
              <Text style={s2.addedText} numberOfLines={1}>{url}</Text>
              <TouchableOpacity
                onPress={() => setManualList((prev) => prev.filter((_, idx) => idx !== i))}
                style={s2.removeBtn}
              >
                <Text style={s2.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Animated.View>

        <TouchableOpacity onPress={() => onComplete([])} activeOpacity={0.7}>
          <Text style={s2.skipText}>Skip for now — I'll add competitors later</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={[s2.cta, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={onBack} style={s2.backBtn} activeOpacity={0.75}>
          <Text style={s2.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFinish} activeOpacity={0.85} style={s2.finishBtn}>
          <Text style={s2.finishBtnText}>
            {totalCount > 0 ? `Start Monitoring (${totalCount})` : 'Finish Setup'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s2 = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 8, gap: 20 },
  headerRow: { marginBottom: 8 },
  aiBadge: {
    alignSelf: 'flex-start',
    backgroundColor: OODA.primaryGlow,
    borderWidth: 1,
    borderColor: OODA.primaryGlowStrong,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginBottom: 10,
  },
  aiBadgeText: { fontSize: 12, fontWeight: '700', color: OODA.primaryDark },
  title: { fontSize: 26, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, color: OODA.textSecondary, lineHeight: 22 },
  suggestedList: { gap: 10 },
  compCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: OODA.border,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  compCardSelected: {
    borderColor: OODA.primary,
    backgroundColor: OODA.primaryGlow,
  },
  compLogo: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  compLogoText: { fontSize: 20, fontWeight: '800', color: OODA.textInverse },
  compInfo: { flex: 1, gap: 2 },
  compName: { fontSize: 15, fontWeight: '700', color: OODA.textPrimary },
  compTagline: { fontSize: 12, color: OODA.textTertiary, lineHeight: 17 },
  compCategory: { fontSize: 11, fontWeight: '600', color: OODA.primary, marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: OODA.border,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: OODA.primary, borderColor: OODA.primary },
  checkmark: { fontSize: 13, fontWeight: '800', color: OODA.textInverse },
  manualCard: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    padding: 20,
    gap: 12,
  },
  manualTitle: { fontSize: 15, fontWeight: '700', color: OODA.textPrimary },
  manualSub: { fontSize: 13, color: OODA.textSecondary, lineHeight: 19, marginTop: -4 },
  manualRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  manualInput: {
    flex: 1,
    backgroundColor: OODA.bgSurface,
    borderWidth: 1.5,
    borderColor: OODA.border,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: OODA.textPrimary,
  },
  addBtn: {
    backgroundColor: OODA.bgSurface,
    borderWidth: 1.5,
    borderColor: OODA.border,
    borderRadius: Radius.md,
    paddingHorizontal: 18,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: { fontSize: 14, fontWeight: '700', color: OODA.textSecondary },
  addedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: OODA.successBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: OODA.success,
  },
  addedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OODA.success, flexShrink: 0 },
  addedText: { flex: 1, fontSize: 13, color: OODA.textSecondary, fontWeight: '500' },
  removeBtn: { padding: 4 },
  removeBtnText: { fontSize: 14, color: OODA.textTertiary },
  urlError: { fontSize: 12, color: OODA.danger, fontWeight: '500', marginTop: -4 },
  skipText: { fontSize: 13, color: OODA.textTertiary, textAlign: 'center', textDecorationLine: 'underline' },
  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: OODA.bg,
    borderTopWidth: 1,
    borderTopColor: OODA.border,
    flexDirection: 'row',
    gap: 12,
  },
  backBtn: {
    flex: 1,
    height: 54,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: OODA.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: OODA.textSecondary },
  finishBtn: {
    flex: 2,
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: OODA.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: OODA.primary,
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  finishBtnText: { fontSize: 15, fontWeight: '700', color: OODA.textInverse },
});

// ─────────────────────────────────────────────
// ONBOARDING FLOW (Parent)
// 3 internal states: step1 → discovering → step2
// ─────────────────────────────────────────────
type FlowState = 'step1' | 'discovering' | 'step2';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const insets = useSafeAreaInsets();
  const { updateCompany, updateCompetitors, updateOnboarding } = useCompany();

  const [flowState, setFlowState] = useState<FlowState>('step1');

  async function handleStep1(profile: CompanyProfile) {
    await updateCompany(profile);
    await updateOnboarding({ completed: false, currentStep: 2 });
    setFlowState('discovering');
  }

  async function handleStep2(competitors: Competitor[]) {
    await updateCompetitors(competitors);
    await updateOnboarding({ completed: true, currentStep: 2 });
    
    // Kick off the intelligence pipeline asynchronously so it doesn't block the UI
    import('@/services/IntelligencePipeline').then(m => m.IntelligencePipeline.runInitialOnboarding()).catch(console.error);

    onComplete();
  }

  const step = flowState === 'step1' ? 1 : 2;

  return (
    <View style={ob.screen}>
      {/* Header — hidden during discovery */}
      {flowState !== 'discovering' && (
        <View style={[ob.header, { paddingTop: insets.top + 16 }]}>
          <View style={ob.logoRow}>
            <View style={ob.logoDiamond}>
              <Text style={ob.logoText}>O</Text>
            </View>
            <Text style={ob.appName}>OODA</Text>
          </View>
          <Text style={ob.stepLabel}>Step {step} of 2</Text>
        </View>
      )}

      {/* Progress bar — hidden during discovery */}
      {flowState !== 'discovering' && <ProgressBar step={step} />}

      {/* Content */}
      <Animated.View key={flowState} entering={FadeInRight.duration(350).springify()} style={{ flex: 1 }}>
        {flowState === 'step1' && <Step1 onNext={handleStep1} />}
        {flowState === 'discovering' && (
          <DiscoveryAnim onDone={() => setFlowState('step2')} />
        )}
        {flowState === 'step2' && (
          <Step2 onComplete={handleStep2} onBack={() => setFlowState('step1')} />
        )}
      </Animated.View>
    </View>
  );
}

const ob = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoDiamond: {
    width: 32,
    height: 32,
    backgroundColor: OODA.primary,
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: { color: OODA.textInverse, fontWeight: '800', fontSize: 14, transform: [{ rotate: '-45deg' }] },
  appName: { fontSize: 18, fontWeight: '800', color: OODA.textPrimary, letterSpacing: 2 },
  stepLabel: { fontSize: 13, fontWeight: '600', color: OODA.textTertiary },
});
