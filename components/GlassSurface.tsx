import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type ViewProps,
} from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import type { WeatherTheme } from '../utils/weatherTheme';

const TransparencyContext = createContext(false);
const BackgroundContext = createContext<
  React.RefObject<View | null> | undefined
>(undefined);
export const useReducedTransparency = () => useContext(TransparencyContext);

export function SurfacePreferences({
  children,
}: {
  children: React.ReactNode;
}) {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let active = true;
    if (Platform.OS === 'web') {
      const media = window.matchMedia?.(
        '(prefers-reduced-transparency: reduce)',
      );
      const change = () => setReduced(media?.matches ?? false);
      change();
      media?.addEventListener('change', change);
      return () => media?.removeEventListener('change', change);
    }
    AccessibilityInfo.isReduceTransparencyEnabled?.()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {
        if (active) setReduced(true);
      });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceTransparencyChanged',
      setReduced,
    );
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return (
    <TransparencyContext.Provider value={reduced}>
      {children}
    </TransparencyContext.Provider>
  );
}

export function WeatherBackdrop({
  theme,
  children,
}: {
  theme: WeatherTheme;
  children: React.ReactNode;
}) {
  const target = useRef<View | null>(null);
  return (
    <BackgroundContext.Provider value={target}>
      <View style={{ flex: 1, backgroundColor: theme.gradientStart }}>
        <BlurTargetView
          ref={target}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
        >
          <LinearGradient
            colors={theme.gradient}
            locations={theme.gradientLocations}
            style={StyleSheet.absoluteFill}
          />
        </BlurTargetView>
        {children}
      </View>
    </BackgroundContext.Provider>
  );
}

export function GlassSurface({
  theme,
  opaque = false,
  style,
  children,
  ...props
}: ViewProps & { theme: WeatherTheme; opaque?: boolean }) {
  const target = useContext(BackgroundContext);
  const reduced = useReducedTransparency();
  const radius = StyleSheet.flatten(style)?.borderRadius ?? 18;
  const webBlur =
    Platform.OS === 'web' &&
    typeof CSS !== 'undefined' &&
    (CSS.supports('backdrop-filter', 'blur(24px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(24px)'));
  const canBlur =
    !opaque &&
    !reduced &&
    (Platform.OS === 'ios' ||
      (Platform.OS === 'android' &&
        Number(Platform.Version) >= 31 &&
        !!target) ||
      webBlur);
  return (
    <View {...props} style={[styles.surface, style]}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.clip, { borderRadius: radius }]}
      >
        {canBlur && Platform.OS !== 'web' && (
          <BlurView
            testID="glass-blur"
            blurTarget={target}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={35}
            tint="default"
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          testID="glass-fill"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: canBlur ? theme.glass : theme.surface },
            canBlur && Platform.OS === 'web'
              ? { backdropFilter: 'blur(24px)' }
              : undefined,
          ]}
        />
      </View>
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  surface: {
    borderRadius: 18,
  },
  clip: { overflow: 'hidden' },
});
