import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type LayoutRectangle,
  type RefreshControlProps,
  type ViewStyle,
} from 'react-native';
import { RefreshControl } from 'react-native';
import { useSceneOpening, type HeroOpening } from './WeatherScenery';
import { useAdaptiveLayout } from '../hooks/useAdaptiveLayout';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { SettingsButton } from './SettingsButton';
import { GlassViewportContext } from './GlassSurface';
import { heroLetterShadow, type WeatherTheme } from '../utils/weatherTheme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SETTINGS_SIZE = 44;

interface PaneLayout {
  header?: React.ReactElement;
  contentPadding?: ViewStyle;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}

interface ScrollingScreenProps {
  theme: WeatherTheme;
  title: string | React.ReactElement;
  heroOpening?: HeroOpening;
  titleAlign?: 'left' | 'center';
  headerTrailing?: React.ReactNode;
  children: React.ReactNode | ((layout: PaneLayout) => React.ReactNode);
  paneScroll?: SharedValue<number>;
  onBack?: () => void;
  showSettings?: boolean;
  onRefresh?: () => Promise<void>;
  refreshBusy?: boolean;
  bottomInset?: boolean;
  fillViewport?: boolean;
  scrollEnabled?: boolean;
}

export function ScrollingScreen({
  theme,
  title,
  heroOpening,
  titleAlign = 'center',
  headerTrailing,
  children,
  paneScroll,
  onBack,
  showSettings = false,
  onRefresh,
  refreshBusy = false,
  bottomInset = false,
  fillViewport = false,
  scrollEnabled = true,
}: ScrollingScreenProps) {
  const insets = useSafeAreaInsets();
  const adaptive = useAdaptiveLayout();
  const headingAlign = adaptive.rail ? 'left' : titleAlign;
  const centered = headingAlign === 'center';
  showSettings = showSettings && !adaptive.rail;
  const { fontScale } = useWindowDimensions();
  const toolbarHeight = Math.max(48, Math.ceil(24 * fontScale) + 16);
  const hasBack = Boolean(onBack);
  const [refreshing, setRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const mounted = useRef(true);
  const screenScroll = useSharedValue(0);
  const scrollY = paneScroll ?? screenScroll;
  const glassLayout = useSharedValue(0);
  const glassViewport = useMemo(
    () => ({ scroll: scrollY, layout: glassLayout }),
    [scrollY, glassLayout],
  );
  const refreshGlassLayout = () => glassLayout.set((n) => n + 1);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const expandedHeaderCenter = useSharedValue(12 + toolbarHeight / 2);

  const [header, setHeader] = useState<LayoutRectangle>();
  const settings = useMemo(() => {
    if (!showSettings || !header) return;
    return {
      x: header.x + header.width - SETTINGS_SIZE,
      y: header.y + (centered ? (header.height - SETTINGS_SIZE) / 2 : 0),
      width: SETTINGS_SIZE,
      height: SETTINGS_SIZE,
    };
  }, [showSettings, header, centered]);
  useSceneOpening({
    headerBottom: header ? header.y + header.height : 0,
    settings,
    hero: heroOpening,
    scroll: scrollY,
    insetTop: insets.top,
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (fillViewport) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      screenScroll.set(0);
    }
  }, [fillViewport, screenScroll]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    // Overscroll belongs to refresh; keep the back action at its resting position.
    screenScroll.set(Math.max(0, event.contentOffset.y));
  });

  const backButtonStyle = useAnimatedStyle(() => ({
    // Follow the measured title row until the action reaches the toolbar.
    // Measuring also accounts for wrapped titles and larger system text.
    transform: [
      {
        translateY: Math.max(
          0,
          expandedHeaderCenter.value - toolbarHeight / 2 - scrollY.value,
        ),
      },
    ],
  }));

  const measureTitle = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    setHeader(layout);
    refreshGlassLayout();
    expandedHeaderCenter.value = layout.y + layout.height / 2;
  };

  const handleRefresh = async () => {
    if (!onRefresh || !scrollEnabled || refreshBusy || refreshInFlight.current)
      return;
    refreshInFlight.current = true;
    setRefreshing(true);
    try {
      await onRefresh();
    } catch (error) {
      console.warn('Screen refresh failed:', error);
    } finally {
      refreshInFlight.current = false;
      if (mounted.current) setRefreshing(false);
    }
  };

  // A bounded workspace can attach the same refresh state to its own panes.
  const createRefreshControl = (progressViewOffset: number, active = true) =>
    onRefresh ? (
      <RefreshControl
        refreshing={active && refreshing}
        onRefresh={active && scrollEnabled ? handleRefresh : undefined}
        enabled={active && scrollEnabled && !refreshBusy && !refreshing}
        progressViewOffset={progressViewOffset}
        tintColor={theme.heroText}
        colors={[theme.background]}
      />
    ) : undefined;

  const heading = (
    <View
      testID="screen-expanded-header"
      onLayout={measureTitle}
      style={[
        styles.heading,
        {
          minHeight: toolbarHeight,
          paddingHorizontal: hasBack ? 48 : 0,
        },
      ]}
    >
      {showSettings && centered && <View style={styles.settingsSlot} />}
      <View style={styles.titleContainer}>
        {typeof title === 'string' ? (
          <Text
            accessibilityRole="header"
            style={[
              styles.title,
              heroLetterShadow,
              { color: theme.heroText, textAlign: headingAlign },
              adaptive.rail && { fontSize: 18, fontWeight: '600' },
            ]}
          >
            {title}
          </Text>
        ) : (
          title
        )}
      </View>
      {showSettings && (
        <View style={[styles.settingsSlot, !centered && styles.settingsTop]}>
          <SettingsButton theme={theme} />
        </View>
      )}
      {headerTrailing}
    </View>
  );
  const contentPadding: ViewStyle = {
    paddingTop: 12,
    paddingBottom:
      (bottomInset || adaptive.rail
        ? insets.bottom
        : Math.max(insets.bottom, 8) + adaptive.navigationHeight + 12) + 24,
    paddingLeft: (adaptive.rail ? 0 : insets.left) + 16,
    paddingRight: insets.right + 16,
  };
  const frame = [styles.screen, { marginTop: insets.top }];

  return (
    <View style={styles.screen}>
      <GlassViewportContext.Provider value={glassViewport}>
        {typeof children === 'function' ? (
          <View
            style={[frame, fillViewport && contentPadding]}
            onLayout={refreshGlassLayout}
          >
            {fillViewport && heading}
            {children({
              header: fillViewport ? undefined : heading,
              contentPadding: fillViewport ? undefined : contentPadding,
              refreshControl: createRefreshControl(
                fillViewport ? 0 : toolbarHeight,
              ),
            })}
          </View>
        ) : (
          <Animated.ScrollView
            ref={scrollRef}
            testID="screen-scroll"
            style={frame}
            scrollEnabled={scrollEnabled && !fillViewport}
            contentContainerStyle={[
              styles.content,
              fillViewport && { flex: 1, minHeight: 0 },
              contentPadding,
            ]}
            onScroll={scrollHandler}
            onLayout={refreshGlassLayout}
            onContentSizeChange={refreshGlassLayout}
            scrollEventThrottle={16}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            showsVerticalScrollIndicator={false}
            refreshControl={createRefreshControl(toolbarHeight, !fillViewport)}
          >
            {heading}
            {children}
          </Animated.ScrollView>
        )}
      </GlassViewportContext.Provider>

      {onBack && (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          // Keep the back action in its own Android layer while scrolling.
          renderToHardwareTextureAndroid
          style={[
            styles.action,
            {
              top: insets.top + (toolbarHeight - 44) / 2,
              left: (adaptive.rail ? 0 : insets.left) + 20,
              backgroundColor: theme.surface,
            },
            backButtonStyle,
          ]}
        >
          <ArrowLeft size={22} color={theme.text} />
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1 },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  titleContainer: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  settingsSlot: { width: SETTINGS_SIZE, minHeight: SETTINGS_SIZE },
  settingsTop: { alignSelf: 'flex-start' },
  action: {
    position: 'absolute',
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
