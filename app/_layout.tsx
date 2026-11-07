import {
  Stack,
  useRouter,
  useRootNavigationState,
  usePathname,
} from 'expo-router';
import { useEffect } from 'react';
import { ApiKeyProvider, useApiKeys } from '../contexts/ApiKeyContext';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { SurfacePreferences } from '../components/GlassSurface';
import { WeatherProvider, useWeather } from '../contexts/WeatherContext';

function RootLayoutNav() {
  const { areKeysSet, isLoading } = useApiKeys();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const pathname = usePathname();
  const { theme } = useWeather();

  const rootRoute = navigationState?.routes?.[navigationState.index ?? 0]?.name;

  useEffect(() => {
    if (isLoading || !navigationState?.key) {
      return;
    }
    if (areKeysSet && rootRoute && rootRoute !== 'welcome') return;
    // Keep onboarding's key configuration reachable inside the shared shell.
    if (!areKeysSet && pathname === '/settings') return;
    const targetRoute = areKeysSet ? '/(tabs)' : '/welcome';
    const timer = setTimeout(() => router.replace(targetRoute), 1);

    return () => clearTimeout(timer);
  }, [
    areKeysSet,
    isLoading,
    navigationState?.key,
    rootRoute,
    pathname,
    router,
  ]);

  if (isLoading || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
      <StatusBar style={rootRoute === 'welcome' ? 'dark' : 'light'} />
      <Stack
        screenOptions={{
          headerShown: false,
          orientation: 'portrait',
          contentStyle: { backgroundColor: theme.gradientStart },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ApiKeyProvider>
      <WeatherProvider>
        <SurfacePreferences>
          <RootLayoutNav />
        </SurfacePreferences>
      </WeatherProvider>
    </ApiKeyProvider>
  );
}
