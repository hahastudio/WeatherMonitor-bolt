import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Settings } from 'lucide-react-native';
import type { WeatherTheme } from '../utils/weatherTheme';

export function SettingsButton({ theme }: { theme: WeatherTheme }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      onPress={() => router.navigate('/settings')}
      style={[styles.button, { backgroundColor: theme.surface }]}
    >
      <Settings size={22} color={theme.text} />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
