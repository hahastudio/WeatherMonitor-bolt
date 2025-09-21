import React, { useEffect } from 'react';
import { Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { defaultTheme } from '../utils/weatherTheme';
import { LinearGradient } from 'expo-linear-gradient';

const WelcomeScreen = () => {
  const router = useRouter();
  const fadeAnim = React.useMemo(() => new Animated.Value(0), []);
  const scaleAnim = React.useMemo(() => new Animated.Value(0.9), []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 20,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const goToSettings = () => {
    router.replace('/(tabs)/settings');
  };

  return (
    <LinearGradient
      colors={[
        defaultTheme.colors.background,
        defaultTheme.colors.primary + '20',
      ]}
      style={styles.gradient}
    >
      <Animated.View
        style={[
          styles.container,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Welcome to WeatherMonitor</Text>
        <Text style={styles.subtitle}>
          To get started, you need to configure your API keys for the weather
          and AI services. These keys will enable real-time weather data,
          forecasts, and AI-powered summaries.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={goToSettings}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Configure API Keys</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: defaultTheme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: defaultTheme.colors.text + 'CC',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
    maxWidth: '80%',
  },
  button: {
    backgroundColor: defaultTheme.colors.primary + '20',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: defaultTheme.colors.primary + '40',
  },
  buttonText: {
    color: defaultTheme.colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default WelcomeScreen;
