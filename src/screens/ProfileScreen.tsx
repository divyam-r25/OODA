// ─────────────────────────────────────────────
// OODA — Profile Screen (Client-Centric)
// Company info · AI Models nav · Wipe · Logout
// ─────────────────────────────────────────────

import React from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import { useAuth } from '@/store/AuthContext';
import { useCompany } from '@/store/CompanyContext';
import { wipeAllData } from '@/store/storage';

// ── Nav Row ───────────────────────────────────
function NavRow({
  icon,
  title,
  subtitle,
  onPress,
  danger,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={nr.row}>
      <View style={[nr.iconWrap, danger && nr.iconWrapDanger]}>
        {icon}
      </View>
      <View style={nr.texts}>
        <Text style={[nr.title, danger && nr.titleDanger]}>{title}</Text>
        {subtitle && <Text style={nr.sub}>{subtitle}</Text>}
      </View>
      {!danger && <Ionicons name="chevron-forward" size={20} color={OODA.textMuted} />}
    </TouchableOpacity>
  );
}

const nr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: OODA.primaryGlow, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  iconWrapDanger: { backgroundColor: OODA.dangerBg },
  icon: { fontSize: 18 },
  texts: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: OODA.textPrimary },
  titleDanger: { color: OODA.danger },
  sub: { fontSize: 12, color: OODA.textTertiary, marginTop: 2, lineHeight: 17 },
  chevron: { fontSize: 20, color: OODA.textMuted, fontWeight: '300' },
});

// ── Divider ───────────────────────────────────
function Divider() {
  return <View style={{ height: 1, backgroundColor: OODA.border, marginHorizontal: -20 }} />;
}

// ── Profile Screen ────────────────────────────
interface ProfileScreenProps {
  onOpenModels: () => void;
}

export function ProfileScreen({ onOpenModels }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { company, competitors, clearAll } = useCompany();

  function handleLogout() {
    Alert.alert(
      'Log out',
      "You'll be taken back to the login screen. Your company data stays saved.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: () => logout() },
      ]
    );
  }

  function handleWipeData() {
    Alert.alert(
      'Wipe all data',
      "This will delete your company profile, competitors, AI settings, and all configuration. You'll need to set up OODA again from scratch.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            await wipeAllData();
            await logout();
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_HEIGHT + 32 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + Name */}
      <Animated.View entering={FadeInDown.duration(450).springify()} style={styles.heroRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {company?.name?.charAt(0)?.toUpperCase() ?? 'O'}
          </Text>
          <View style={styles.onlineDot} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.companyName}>{company?.name ?? 'Your Company'}</Text>
          <Text style={styles.companyIndustry}>{company?.industry ?? 'Not configured'}</Text>
          <Text style={styles.watchingText}>
            {competitors.length > 0
              ? `Watching ${competitors.length} competitor${competitors.length !== 1 ? 's' : ''}`
              : 'No competitors added'}
          </Text>
        </View>
      </Animated.View>

      {/* Company Card */}
      {company && (
        <Animated.View entering={FadeInDown.delay(80).duration(450).springify()} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Company</Text>
            <TouchableOpacity style={styles.editBtn} activeOpacity={0.75}>
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {[
            { label: 'Industry', value: company.industry },
            { label: 'Location', value: company.location },
            { label: 'Website', value: company.website },
            { label: 'Customers', value: company.targetAudience },
            { label: 'Type', value: company.businessType },
            { label: 'Goal', value: company.primaryGoal },
            { label: 'Competitors', value: `${competitors.length} tracked` },
          ].filter((r) => r.value).map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{row.label}</Text>
                <Text style={styles.infoValue} numberOfLines={1}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.rowDivider} />}
            </View>
          ))}
        </Animated.View>
      )}

      {/* Settings Card */}
      <Animated.View entering={FadeInDown.delay(160).duration(450).springify()} style={styles.card}>
        <NavRow
          icon={<Ionicons name="hardware-chip-outline" size={22} color={OODA.primaryDark} />}
          title="AI Models"
          subtitle="Configure local and cloud models"
          onPress={onOpenModels}
        />
        <Divider />
        <NavRow
          icon={<Ionicons name="people-outline" size={22} color={OODA.primaryDark} />}
          title="Competitors"
          subtitle={competitors.map((c) => c.name).join(', ') || 'None added yet'}
          onPress={() => {}}
        />
      </Animated.View>

      {/* Session & Data Card */}
      <Animated.View entering={FadeInDown.delay(240).duration(450).springify()} style={styles.card}>
        <NavRow
          icon={<Ionicons name="log-out-outline" size={22} color={OODA.primaryDark} />}
          title="Log Out"
          subtitle="Sign out without removing your data"
          onPress={handleLogout}
        />
        <Divider />
        <NavRow
          icon={<Ionicons name="trash-outline" size={22} color={OODA.danger} />}
          title="Wipe All Data"
          subtitle="Reset onboarding and all company information"
          onPress={handleWipeData}
          danger
        />
      </Animated.View>

      <Text style={styles.version}>OODA Intelligence · v1.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: OODA.bg },
  content: { paddingHorizontal: 20, gap: 16 },

  // Hero
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 4 },
  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: OODA.primary, justifyContent: 'center', alignItems: 'center', position: 'relative',
  },
  avatarText: { fontSize: 24, fontWeight: '800', color: OODA.textInverse },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7, backgroundColor: OODA.success,
    borderWidth: 2.5, borderColor: OODA.bg,
  },
  companyName: { fontSize: 20, fontWeight: '700', color: OODA.textPrimary, letterSpacing: -0.3 },
  companyIndustry: { fontSize: 13, color: OODA.textTertiary, fontWeight: '500' },
  watchingText: { fontSize: 12, color: OODA.primary, fontWeight: '600', marginTop: 2 },

  // Card
  card: {
    backgroundColor: OODA.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: OODA.border,
    paddingHorizontal: 20,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  cardTitle: { fontSize: 13, fontWeight: '700', color: OODA.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8 },
  editBtn: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill, backgroundColor: OODA.primaryGlow, borderWidth: 1, borderColor: OODA.primaryGlowStrong },
  editBtnText: { fontSize: 12, fontWeight: '700', color: OODA.primaryDark },

  // Info rows
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 14, color: OODA.textTertiary, fontWeight: '500' },
  infoValue: { fontSize: 14, color: OODA.textPrimary, fontWeight: '600', flex: 1, textAlign: 'right', marginLeft: 12 },
  rowDivider: { height: 1, backgroundColor: OODA.borderSubtle },

  version: { fontSize: 12, color: OODA.textMuted, textAlign: 'center', paddingTop: 4 },
});
