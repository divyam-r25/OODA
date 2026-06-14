// ─────────────────────────────────────────────
// OODA — Custom Bottom Tab Bar (5 tabs)
// Home | Activity | Comparison | AI | Profile
// ─────────────────────────────────────────────

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { OODA, Radius, TAB_BAR_HEIGHT } from '@/constants/theme';
import type { TabId } from '@/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PADDING = 16;
const AVAILABLE = SCREEN_WIDTH - H_PADDING * 2;
const N_TABS = 5;
const TAB_W = AVAILABLE / N_TABS;
const INDICATOR = 44;

// ── Icons ─────────────────────────────────────
function HomeIcon({ color, size, active }: { color: string; size: number; active: boolean }) {
  return <Ionicons name={active ? 'home' : 'home-outline'} size={size} color={color} />;
}

function ActivityIcon({ color, size, active }: { color: string; size: number; active: boolean }) {
  return <Ionicons name={active ? 'list' : 'list-outline'} size={size} color={color} />;
}

function ComparisonIcon({ color, size, active }: { color: string; size: number; active: boolean }) {
  return <Ionicons name={active ? 'bar-chart' : 'bar-chart-outline'} size={size} color={color} />;
}

function SparkleIcon({ color, size, active }: { color: string; size: number; active: boolean }) {
  return <Ionicons name={active ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />;
}

function ProfileIcon({ color, size, active }: { color: string; size: number; active: boolean }) {
  return <Ionicons name={active ? 'person' : 'person-outline'} size={size} color={color} />;
}

// ── Tab labels ────────────────────────────────
const TABS: { id: TabId; label: string; Icon: React.FC<{ color: string; size: number; active: boolean }> }[] = [
  { id: 'dashboard', label: 'Home', Icon: HomeIcon },
  { id: 'activity', label: 'Activity', Icon: ActivityIcon },
  { id: 'comparison', label: 'Compare', Icon: ComparisonIcon },
  { id: 'assistant', label: 'Ask AI', Icon: SparkleIcon },
  { id: 'profile', label: 'Profile', Icon: ProfileIcon },
];

// ── Tab Item ──────────────────────────────────
function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[0];
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 1, { damping: 14, stiffness: 300 });
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const iconColor = isActive ? OODA.textInverse : OODA.tabInactive;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.tabItem}>
      <Animated.View style={[styles.tabInner, animStyle]}>
        <tab.Icon color={iconColor} size={22} active={isActive} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Bottom Tab Bar ────────────────────────────
interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const activeIndex = TABS.findIndex((t) => t.id === activeTab);

  const indicatorX = useSharedValue(activeIndex * TAB_W + TAB_W / 2 - INDICATOR / 2);

  useEffect(() => {
    indicatorX.value = withSpring(activeIndex * TAB_W + TAB_W / 2 - INDICATOR / 2, {
      damping: 20,
      stiffness: 250,
    });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }));

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : 18 }]}>
      <View style={styles.pill}>
        <Animated.View style={[styles.indicator, indicatorStyle]} />
        <View style={styles.tabs}>
          {TABS.map((tab) => (
            <TabItem
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              onPress={() => onTabChange(tab.id)}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: H_PADDING,
  },
  pill: {
    backgroundColor: 'rgba(255,255,255,0.94)',
    borderRadius: Radius.pill,
    height: TAB_BAR_HEIGHT,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    borderWidth: 1,
    borderColor: OODA.border,
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR,
    height: INDICATOR,
    borderRadius: INDICATOR / 2,
    backgroundColor: OODA.primary,
    top: (TAB_BAR_HEIGHT - INDICATOR) / 2,
    shadowColor: OODA.primary,
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  tabs: { flex: 1, flexDirection: 'row', height: '100%' },
  tabItem: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  tabInner: { width: INDICATOR, height: INDICATOR, justifyContent: 'center', alignItems: 'center' },
});
