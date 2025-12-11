import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ApiKeyProvider, useApiKeys } from '../contexts/ApiKeyContext';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { WeatherProvider } from '../contexts/WeatherContext';

function RootLayoutNav() {
  const { areKeysSet } = useApiKeys();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) {
      return;
    }
    const targetRoute = areKeysSet ? '/(tabs)' : '/welcome';
    const timer = setTimeout(() => router.replace(targetRoute), 1);

    return () => clearTimeout(timer);
  }, [areKeysSet, navigationState?.key, router]);

  if (!navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="air-quality"
        options={{
          headerShown: false,
          animation: 'slide_from_right'
        }}
      />
      <Stack.Screen name="+not-found" />
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <ApiKeyProvider>
      <WeatherProvider>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </WeatherProvider>
    </ApiKeyProvider>
  );
}
