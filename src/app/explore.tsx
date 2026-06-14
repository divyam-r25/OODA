// This file is kept for Expo Router compatibility.
// The explore route is no longer used in the OODA navigation.
// All navigation is handled via the custom BottomTabBar in src/app/index.tsx

import { Redirect } from 'expo-router';

export default function ExploreRedirect() {
  return <Redirect href="/" />;
}
