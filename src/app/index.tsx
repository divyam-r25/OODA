// ─────────────────────────────────────────────
// OODA — App Entry Point
// Auth → Onboarding → Main App routing
// AI Models accessible from Profile & Assistant
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { BottomTabBar } from '@/components/navigation/BottomTabBar';
import { OODA } from '@/constants/theme';
import { ActivityScreen } from '@/screens/ActivityScreen';
import { AIModelsScreen } from '@/screens/AIModelsScreen';
import { AssistantScreen } from '@/screens/AssistantScreen';
import { ComparisonScreen } from '@/screens/ComparisonScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { OnboardingFlow } from '@/screens/OnboardingFlow';
import { ProfileScreen } from '@/screens/ProfileScreen';
import { useAuth } from '@/store/AuthContext';
import { useCompany } from '@/store/CompanyContext';
import type { TabId } from '@/types';

// ── Screen router ─────────────────────────────
function ActiveScreen({
  tab,
  onOpenModels,
  onTabChange,
}: {
  tab: TabId;
  onOpenModels: () => void;
  onTabChange: (tab: TabId) => void;
}) {
  switch (tab) {
    case 'dashboard':   return <DashboardScreen onStartDiscussion={() => onTabChange('assistant')} />;
    case 'activity':    return <ActivityScreen />;
    case 'comparison':  return <ComparisonScreen />;
    case 'assistant':   return <AssistantScreen onOpenModels={onOpenModels} />;
    case 'profile':     return <ProfileScreen onOpenModels={onOpenModels} />;
    default:            return <DashboardScreen onStartDiscussion={() => onTabChange('assistant')} />;
  }
}

// ── Main App ──────────────────────────────────
function MainApp() {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [showModels, setShowModels] = useState(false);

  if (showModels) {
    return (
      <Animated.View entering={FadeIn.duration(250)} style={styles.app}>
        <AIModelsScreen onBack={() => setShowModels(false)} />
      </Animated.View>
    );
  }

  return (
    <View style={styles.app}>
      <Animated.View key={activeTab} entering={FadeIn.duration(200)} style={styles.screen}>
        <ActiveScreen tab={activeTab} onOpenModels={() => setShowModels(true)} onTabChange={setActiveTab} />
      </Animated.View>
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </View>
  );
}

// ── Root ──────────────────────────────────────
export default function IndexScreen() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { company, onboarding, isLoading: companyLoading } = useCompany();

  if (authLoading || companyLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={OODA.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.app}>
        <LoginScreen />
      </Animated.View>
    );
  }

  if (!onboarding.completed || !company) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.app}>
        <OnboardingFlow onComplete={() => {}} />
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.app}>
      <MainApp />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  app: { flex: 1, backgroundColor: OODA.bg },
  screen: { flex: 1 },
  loading: { flex: 1, backgroundColor: OODA.bg, justifyContent: 'center', alignItems: 'center' },
});
