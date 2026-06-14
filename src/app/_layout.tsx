// ─────────────────────────────────────────────
// OODA — Root Layout
// Provides Auth + Company context, StatusBar
// ─────────────────────────────────────────────

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/store/AuthContext';
import { CompanyProvider } from '@/store/CompanyContext';
import { useEffect } from 'react';
import { ScraperScheduler } from '@/services/scraper/ScraperScheduler';

export default function RootLayout() {
  useEffect(() => {
    ScraperScheduler.start();
    return () => {
      ScraperScheduler.stop();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <CompanyProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="index" />
            </Stack>
          </CompanyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
