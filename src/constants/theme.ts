// ─────────────────────────────────────────────
// OODA — Design System & Theme Tokens (Light Velocis Theme)
// ─────────────────────────────────────────────

import '@/global.css';
import { Platform } from 'react-native';

// ── Legacy colors (kept for Expo boilerplate compat) ──
export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

// ── OODA Design Tokens ────────────────────────
export const OODA = {
  // Backgrounds
  bg: '#F2F9F0', // Soft pale green
  bgDeep: '#E4EFE0', // Slightly deeper pastel green
  bgSurface: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardGlass: 'rgba(255, 255, 255, 0.7)',

  // Borders
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  borderFocus: 'rgba(115, 144, 78, 0.4)',
  borderCard: '#E5E7EB',

  // Primary — Olive/Forest Green
  primary: '#73904E',
  primaryLight: '#8AA865',
  primaryDark: '#5B7A38',
  primaryGlow: 'rgba(115, 144, 78, 0.15)',
  primaryGlowStrong: 'rgba(115, 144, 78, 0.30)',

  // Secondary — Deep Blue/Purple for variety
  secondary: '#3B82F6',
  secondaryLight: '#60A5FA',
  secondaryGlow: 'rgba(59, 130, 246, 0.15)',

  // Accent — Cyan
  accent: '#06B6D4',
  accentGlow: 'rgba(6, 182, 212, 0.15)',

  // Semantic
  success: '#10B981',
  successLight: '#34D399',
  successGlow: 'rgba(16, 185, 129, 0.15)',
  successBg: 'rgba(16, 185, 129, 0.1)',

  warning: '#F59E0B',
  warningLight: '#FCD34D',
  warningGlow: 'rgba(245, 158, 11, 0.15)',
  warningBg: 'rgba(245, 158, 11, 0.1)',

  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  dangerGlow: 'rgba(239, 68, 68, 0.15)',
  dangerBg: 'rgba(239, 68, 68, 0.1)',

  // Text
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textTertiary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Tab Bar
  tabBarBg: 'rgba(255, 255, 255, 0.85)',
  tabBarBorder: 'transparent',
  tabActive: '#1F2937', // Icon color when active
  tabInactive: '#6B7280',

  // Gradients (for experimental_backgroundImage)
  gradientPrimary: 'linear-gradient(135deg, #73904E 0%, #8AA865 100%)',
  gradientSecondary: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
  gradientSuccess: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  gradientDanger: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
  gradientCard: 'linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%)',
  gradientHero: 'linear-gradient(180deg, #E4EFE0 0%, #F2F9F0 100%)',
  gradientScan: 'linear-gradient(90deg, transparent 0%, rgba(115,144,78,0.2) 50%, transparent 100%)',
} as const;

// ── Typography ────────────────────────────────
export const Typography = {
  hero: { fontSize: 38, fontWeight: '700', letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontSize: 22, fontWeight: '600', letterSpacing: -0.3 },
  h3: { fontSize: 18, fontWeight: '600', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodySmall: { fontSize: 13, fontWeight: '400', lineHeight: 19 },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  caption: { fontSize: 11, fontWeight: '500', letterSpacing: 0.3 },
  mono: { fontSize: 13, fontWeight: '500', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
} as const;

// ── Spacing ───────────────────────────────────
export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 12,
  four: 16,
  five: 20,
  six: 24,
  seven: 32,
  eight: 40,
  nine: 48,
  ten: 64,
} as const;

// ── Border Radius ─────────────────────────────
export const Radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  pill: 999,
} as const;

// ── Shadows ───────────────────────────────────
export function glowShadow(color: string, intensity: 'soft' | 'medium' | 'strong' = 'medium') {
  // Overriding to generic drop shadow for light theme
  const opacities = { soft: 0.05, medium: 0.08, strong: 0.12 };
  const radii = { soft: 8, medium: 16, strong: 24 };
  return {
    shadowColor: '#000000',
    shadowOpacity: opacities[intensity],
    shadowRadius: radii[intensity],
    shadowOffset: { width: 0, height: 4 },
    elevation: intensity === 'soft' ? 2 : intensity === 'medium' ? 6 : 10,
  };
}

// ── Layout ────────────────────────────────────
export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
  web: { sans: 'var(--font-display)', serif: 'var(--font-serif)', rounded: 'var(--font-rounded)', mono: 'var(--font-mono)' },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const TAB_BAR_HEIGHT = 72;
export const MaxContentWidth = 800;
