import { Stack, useRouter, useRootNavigationState } from 'expo-router';
import { useEffect } from 'react';
import { ApiKeyProvider, useApiKeys } from '../contexts/ApiKeyContext';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '../hooks/useFrameworkReady';
import { WeatherProvider, useWeather } from '../contexts/WeatherContext';

function RootLayoutNav() {
  const { areKeysSet } = useApiKeys();
  const router = useRouter();
  const navigationState = useRootNavigationState();
  const { theme } = useWeather();

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

  // Wrap the Stack in a View whose background matches the current theme.
  // On Android, expo-router/react-native-screens briefly unmounts the
  // outgoing screen during the back-navigation animation, exposing whatever
  // is rendered behind the stack. Without this background, that underlay
  // appears as a white flash. See expo/expo#33647.
  return (
    <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.gradientStart },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="air-quality"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: theme.gradientStart },
          }}
        />
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
        <RootLayoutNav />
        <StatusBar style="auto" />
      </WeatherProvider>
    </ApiKeyProvider>
  );
}
