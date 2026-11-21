import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import { BlurTargetView, BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  measure,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  type AnimatedRef,
  type SharedValue,
} from 'react-native-reanimated';
import {
  materialFill,
  sceneDim,
  type WeatherTheme,
} from '../utils/weatherTheme';
import {
  SceneOpeningContext,
  SceneActive,
  WeatherScenery,
  type SceneOpening,
} from './WeatherScenery';

const TransparencyContext = createContext(false);
const BackgroundContext = createContext<{
  target: React.RefObject<View | null>;
  frame: AnimatedRef<View>;
} | null>(null);
type GlassViewport = {
  scroll: SharedValue<number>;
  layout: SharedValue<number>;
};
export const GlassViewportContext = createContext<GlassViewport | null>(null);
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
  showScenery = false,
  railInset = 0,
  cloudCover,
}: React.PropsWithChildren<{
  theme: WeatherTheme;
  showScenery?: boolean;
  railInset?: number;
  cloudCover?: number;
}>) {
  const target = useRef<View | null>(null);
  const frame = useAnimatedRef<View>();
  const background = useMemo(() => ({ target, frame }), [frame]);
  const [opening, setOpening] = useState<SceneOpening | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  return (
    <BackgroundContext.Provider value={background}>
      <SceneOpeningContext.Provider value={setOpening}>
        <View
          ref={frame}
          collapsable={false}
          style={{ flex: 1, backgroundColor: theme.sceneTop }}
        >
          <BlurTargetView
            ref={target}
            testID="weather-backdrop"
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            aria-hidden
            style={StyleSheet.absoluteFill}
          >
            <LinearGradient
              colors={theme.gradient}
              locations={theme.gradientLocations}
              style={StyleSheet.absoluteFill}
            />
            {showScenery && (
              <View
                onLayout={({
                  nativeEvent: {
                    layout: { width, height },
                  },
                }) =>
                  setSize((prev) =>
                    prev.width === width && prev.height === height
                      ? prev
                      : { width, height },
                  )
                }
                style={StyleSheet.absoluteFill}
              >
                {opening && (
                  <WeatherScenery
                    theme={theme}
                    opening={opening}
                    {...size}
                    railInset={railInset}
                    cloudCover={cloudCover}
                  />
                )}
              </View>
            )}
            {theme.isDark && (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: sceneDim }]}
              />
            )}
          </BlurTargetView>
          {children}
        </View>
      </SceneOpeningContext.Provider>
    </BackgroundContext.Provider>
  );
}

// Keep the daylight tint aligned with the sky as cards move over it. Layout
// changes remeasure the two views. Scrolling only translates the tint layer.
function DaylightGlass({
  colors,
  locations,
  backdrop,
  viewport: { scroll, layout },
}: {
  colors: NonNullable<WeatherTheme['daylightGlass']>;
  locations: WeatherTheme['gradientLocations'];
  backdrop: AnimatedRef<View>;
  viewport: GlassViewport;
}) {
  const card = useAnimatedRef<View>();
  const cardLayout = useSharedValue(0);
  const placement = useSharedValue<{ top: number; height: number } | null>(
    null,
  );
  useAnimatedReaction(
    () => [cardLayout.get(), layout.get()] as const,
    ([ready]) => {
      if (!ready) return;
      const panel = measure(card);
      const sky = measure(backdrop);
      placement.set(
        panel?.height && sky?.height
          ? {
              top: panel.pageY - sky.pageY + scroll.get(),
              height: sky.height,
            }
          : null,
      );
    },
  );
  const backing = useAnimatedStyle(() => ({
    backgroundColor: placement.get() ? 'transparent' : colors[2],
  }));
  const position = useAnimatedStyle(() => {
    const frame = placement.get();
    return {
      height: frame?.height ?? 0,
      transform: [{ translateY: frame ? scroll.get() - frame.top : 0 }],
    };
  });
  return (
    <Animated.View
      ref={card}
      collapsable={false}
      onLayout={() => cardLayout.set((n) => n + 1)}
      style={[StyleSheet.absoluteFill, backing]}
    >
      <Animated.View
        style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, position]}
      >
        <LinearGradient
          testID="daylight-glass"
          colors={colors}
          locations={locations}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function GlassSurface({
  theme,
  opaque = false,
  navigation = false,
  style,
  children,
  ...props
}: ViewProps & {
  theme: WeatherTheme;
  opaque?: boolean;
  navigation?: boolean;
}) {
  const background = useContext(BackgroundContext);
  const viewport = useContext(GlassViewportContext);
  const target = background?.target;
  const reduced = useReducedTransparency();
  const active = useContext(SceneActive);
  const radius = StyleSheet.flatten(style)?.borderRadius ?? 20;
  const filter = navigation ? 'blur(24px)' : 'blur(10px)';
  const webBlur =
    Platform.OS === 'web' &&
    typeof CSS !== 'undefined' &&
    (CSS.supports('backdrop-filter', filter) ||
      CSS.supports('-webkit-backdrop-filter', filter));
  const translucent =
    active &&
    !opaque &&
    !reduced &&
    (Platform.OS === 'ios' ||
      (Platform.OS === 'android' &&
        Number(Platform.Version) >= 31 &&
        !!target) ||
      webBlur);
  // Native blur adds visible grain to the reading surfaces. Composite their
  // tint directly over the sky and reserve native blur for navigation.
  const nativeBlur = translucent && !webBlur && navigation;
  const material = navigation ? theme.navigation : theme.content;
  const intensity = 35;
  // Account for the black overlay in Android's navigation blur.
  const transmission =
    nativeBlur && Platform.OS === 'android'
      ? 1 - Math.floor(((255 * intensity) / 100) * 0.75) / 255
      : 1;
  const fill = translucent
    ? materialFill(material, transmission)
    : theme.surface;
  const daylight =
    translucent &&
    !navigation &&
    theme.daylightGlass &&
    background &&
    viewport ? (
      <DaylightGlass
        colors={theme.daylightGlass}
        locations={theme.gradientLocations}
        backdrop={background.frame}
        viewport={viewport}
      />
    ) : null;
  return (
    <View {...props} style={[{ borderRadius: radius }, style]}>
      <View
        pointerEvents="none"
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        aria-hidden
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: radius, overflow: 'hidden' },
        ]}
      >
        {nativeBlur && (
          <BlurView
            testID="glass-blur"
            blurTarget={target}
            blurMethod="dimezisBlurViewSdk31Plus"
            intensity={intensity}
            tint={
              Platform.OS === 'android'
                ? 'systemChromeMaterialDark'
                : 'systemUltraThinMaterialDark'
            }
            style={StyleSheet.absoluteFill}
          />
        )}
        <View
          testID="glass-fill"
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: daylight ? 'transparent' : fill,
              borderRadius: radius,
              borderWidth: 1,
              borderColor: theme.glassBorder,
            },
            translucent &&
              webBlur &&
              ({
                backdropFilter: filter,
                WebkitBackdropFilter: filter,
              } as ViewStyle),
          ]}
        >
          {daylight}
        </View>
      </View>
      {children}
    </View>
  );
}
