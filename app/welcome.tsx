import React, { useEffect, useMemo } from 'react';
import { useReducedMotion } from 'react-native-reanimated';
import {
  Animated,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useWeather } from '../contexts/WeatherContext';
import { WeatherBackdrop, GlassSurface } from '../components/GlassSurface';

export default function WelcomeScreen() {
  const router = useRouter();
  const { theme } = useWeather();
  const reducedMotion = useReducedMotion();
  const opacity = useMemo(
    () => new Animated.Value(reducedMotion ? 1 : 0),
    [reducedMotion],
  );
  const scale = useMemo(
    () => new Animated.Value(reducedMotion ? 1 : 0.9),
    [reducedMotion],
  );
  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }
    const entrance = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]);
    entrance.start();
    return () => entrance.stop();
  }, [reducedMotion, opacity, scale]);
  return (
    <WeatherBackdrop theme={theme}>
      <ScrollView contentContainerStyle={styles.container}>
        <Animated.View
          style={{
            width: '100%',
            maxWidth: 540,
            opacity,
            transform: [{ scale }],
          }}
        >
          <GlassSurface theme={theme} style={styles.panel}>
            <Text
              accessibilityRole="header"
              style={[styles.title, { color: theme.text }]}
            >
              Welcome to WeatherMonitor
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              To get started, you need to configure your API keys for the
              weather and AI services. These keys will enable real-time weather
              data, forecasts, and AI-powered summaries.
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.button, { backgroundColor: theme.background }]}
              onPress={() => router.replace('/settings')}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Configure API Keys
              </Text>
            </TouchableOpacity>
          </GlassSurface>
        </Animated.View>
      </ScrollView>
    </WeatherBackdrop>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 48,
  },
  panel: { padding: 24, alignItems: 'center' },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 26,
  },
  button: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 12 },
  buttonText: { fontSize: 18, fontWeight: '600', textAlign: 'center' },
});
