import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurTargetView, BlurView } from 'expo-blur';
import { ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { SettingsButton } from './SettingsButton';
import type { WeatherTheme } from '../utils/weatherTheme';

interface ScrollingScreenProps {
  theme: WeatherTheme;
  title: string;
  compactTitle?: string;
  titleIcon?: React.ReactNode;
  titleStyle?: StyleProp<TextStyle>;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  onBack?: () => void;
  showSettings?: boolean;
  onRefresh?: () => Promise<void>;
  refreshBusy?: boolean;
  bottomInset?: boolean;
}

export function ScrollingScreen({
  theme,
  title,
  compactTitle = title,
  titleIcon,
  titleStyle,
  subtitle,
  children,
  onBack,
  showSettings = false,
  onRefresh,
  refreshBusy = false,
  bottomInset = false,
}: ScrollingScreenProps) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const toolbarHeight = Math.max(48, Math.ceil(24 * fontScale) + 16);
  const hasBack = Boolean(onBack);
  const [collapsed, setCollapsed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const refreshInFlight = useRef(false);
  const mounted = useRef(true);
  const blurTarget = useRef<View | null>(null);
  const blurTint =
    theme.text === '#FFFFFF'
      ? 'systemUltraThinMaterialDark'
      : 'systemUltraThinMaterialLight';
  const scrollY = useSharedValue(0);
  const titleBottom = useSharedValue(toolbarHeight + 12);
  const viewportHeight = useSharedValue(0);
  const contentHeight = useSharedValue(0);
  const pastTitle = useDerivedValue(() => scrollY.value >= titleBottom.value);
  const progress = useDerivedValue(() => {
    if (!pastTitle.value) return 0;
    // Short pages must finish the fade before reaching the end of their scroll.
    const availableScroll =
      contentHeight.value > 0 && viewportHeight.value > 0
        ? contentHeight.value - viewportHeight.value - titleBottom.value
        : 48;
    const fadeDistance = Math.min(48, Math.max(0, availableScroll));
    if (fadeDistance === 0) return 1;
    return Math.min(
      1,
      Math.max(0, (scrollY.value - titleBottom.value) / fadeDistance),
    );
  });

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useAnimatedReaction(
    () => pastTitle.value,
    (next, previous) => {
      // Only cross to React when the accessible heading changes, not each frame.
      if (next !== previous) scheduleOnRN(setCollapsed, next);
    },
  );

  const scrollHandler = useAnimatedScrollHandler((event) => {
    // Overscroll belongs to refresh; it must not animate the collapsed header.
    scrollY.value = Math.max(0, event.contentOffset.y);
  });

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: pastTitle.value ? 0 : 1,
  }));
  const compactStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? (pastTitle.value ? 1 : 0) : progress.value,
    transform: [{ translateY: reduceMotion ? 0 : (1 - progress.value) * 8 }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? (pastTitle.value ? 1 : 0) : progress.value,
  }));
  const statusScrimStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion ? (pastTitle.value ? 0 : 1) : 1 - progress.value,
  }));

  const measureTitle = ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
    titleBottom.value = layout.y + layout.height - insets.top;
  };

  const handleRefresh = async () => {
    if (!onRefresh || refreshBusy || refreshInFlight.current) return;
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

  return (
    <View style={styles.screen}>
      <BlurTargetView ref={blurTarget} style={styles.screen}>
        <LinearGradient
          colors={[theme.gradientStart, theme.gradientEnd]}
          style={styles.screen}
        >
          <Animated.ScrollView
            testID="screen-scroll"
            style={styles.screen}
            contentContainerStyle={[
              styles.content,
              {
                paddingTop: insets.top + 12,
                paddingBottom: (bottomInset ? insets.bottom : 0) + 24,
                paddingLeft: insets.left + 20,
                paddingRight: insets.right + 20,
              },
            ]}
            onScroll={scrollHandler}
            onLayout={({ nativeEvent: { layout } }) => {
              viewportHeight.value = layout.height;
            }}
            onContentSizeChange={(_, height) => {
              contentHeight.value = height;
            }}
            scrollEventThrottle={16}
            contentInsetAdjustmentBehavior="never"
            automaticallyAdjustContentInsets={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              onRefresh ? (
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  enabled={!refreshBusy && !refreshing}
                  progressViewOffset={insets.top + toolbarHeight}
                  tintColor={theme.primary}
                  colors={[theme.primary]}
                />
              ) : undefined
            }
          >
            <View
              testID="screen-expanded-header"
              onLayout={measureTitle}
              style={[
                styles.heading,
                {
                  minHeight: toolbarHeight,
                  paddingHorizontal: hasBack || showSettings ? 48 : 0,
                },
              ]}
            >
              <Animated.View
                style={[styles.titleRow, expandedStyle]}
                accessibilityElementsHidden={collapsed}
                importantForAccessibility={
                  collapsed ? 'no-hide-descendants' : 'auto'
                }
              >
                {titleIcon}
                <Text
                  accessibilityRole="header"
                  style={[styles.title, { color: theme.text }, titleStyle]}
                >
                  {title}
                </Text>
              </Animated.View>
              {subtitle}
            </View>
            {children}
          </Animated.ScrollView>
        </LinearGradient>
      </BlurTargetView>

      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          { height: insets.top, backgroundColor: theme.gradientStart },
          statusScrimStyle,
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.frostedHeader,
          {
            height: insets.top + toolbarHeight,
            borderBottomColor: theme.text + '14',
          },
          backdropStyle,
        ]}
      >
        <BlurView
          blurTarget={blurTarget}
          blurMethod="dimezisBlurViewSdk31Plus"
          intensity={70}
          tint={blurTint}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View
        pointerEvents="box-none"
        style={[
          styles.toolbar,
          {
            top: insets.top,
            height: toolbarHeight,
            paddingLeft: insets.left + 20,
            paddingRight: insets.right + 20,
          },
        ]}
      >
        <Animated.View
          testID="screen-compact-header"
          pointerEvents="none"
          accessibilityElementsHidden={!collapsed}
          importantForAccessibility={collapsed ? 'auto' : 'no-hide-descendants'}
          style={[
            styles.compactHeading,
            { paddingHorizontal: hasBack || showSettings ? 48 : 0 },
            compactStyle,
          ]}
        >
          <Text
            accessibilityRole="header"
            accessibilityLabel={compactTitle}
            numberOfLines={1}
            style={[styles.compactTitle, { color: theme.text }]}
          >
            {compactTitle}
          </Text>
        </Animated.View>
      </View>
      {showSettings && (
        <View
          style={[
            styles.settingsAction,
            {
              top: insets.top + (toolbarHeight - 44) / 2,
              right: insets.right + 20,
            },
          ]}
        >
          <SettingsButton theme={theme} />
        </View>
      )}
      {onBack && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={onBack}
          // Keep the persistent action in its own Android layer during fades.
          renderToHardwareTextureAndroid
          style={[
            styles.action,
            {
              top: insets.top + (toolbarHeight - 44) / 2,
              left: insets.left + 20,
              backgroundColor: theme.surface + 'CC',
            },
          ]}
        >
          <ArrowLeft size={22} color={theme.text} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1 },
  heading: { justifyContent: 'center', marginBottom: 16 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 1,
  },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0 },
  frostedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toolbar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  settingsAction: { position: 'absolute', zIndex: 1 },
  action: {
    position: 'absolute',
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactHeading: { flex: 1 },
  compactTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    textAlign: 'center',
  },
});
