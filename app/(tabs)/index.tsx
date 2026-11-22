import React, {
  useContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
  type ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { heroLetterShadow } from '../../utils/weatherTheme';
import { MapPin } from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { useWeatherPane } from '../../contexts/WeatherPaneContext';
import { useAdaptiveLayout } from '../../hooks/useAdaptiveLayout';
import { useNow } from '../../hooks/useNow';
import { ScrollingScreen } from '../../components/ScrollingScreen';
import {
  GlassSurface,
  GlassViewportContext,
  useReducedTransparency,
} from '../../components/GlassSurface';
import { ScrollEdgeFade } from '../../components/ScrollEdgeFade';
import { SceneActive } from '../../components/WeatherScenery';
import { CurrentConditions } from '../../components/CurrentConditions';
import { ForecastContent } from './forecast';
import { AirQualityContent } from './air-quality';

const SCROLL_FADE_SIZE = 16;
const PANE_GAP = 12;

function WeatherScrollPane({
  columns,
  columnWidth,
  visible,
  testID,
  refreshControl,
  scrollOffset,
  header,
  contentPadding,
  children,
}: React.PropsWithChildren<{
  columns: boolean;
  columnWidth?: number;
  visible: boolean;
  testID: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  scrollOffset: SharedValue<number>;
  header?: React.ReactNode;
  contentPadding?: ViewStyle;
}>) {
  const reducedTransparency = useReducedTransparency();
  const active = useContext(SceneActive);
  const parentViewport = useContext(GlassViewportContext);
  const scroll = useAnimatedRef<ScrollView>();
  const paneOffset = useScrollOffset(visible ? scroll : null, scrollOffset);
  const viewport = useMemo(
    () =>
      parentViewport
        ? { ...parentViewport, scroll: paneOffset }
        : parentViewport,
    [parentViewport, paneOffset],
  );
  const offsets = useRef({ single: 0, split: 0 });
  const mode = columns ? 'split' : 'single';
  const bounds = useRef({ viewport: 0, content: 0 });
  const [fades, setFades] = useState({ top: 0, bottom: 0 });
  const restoring = useRef(false);
  const scrollable = useRef(visible);
  const fadeInset = columns && !reducedTransparency ? SCROLL_FADE_SIZE : 0;
  const updateFades = useCallback(() => {
    const { viewport, content } = bounds.current;
    const overflow = viewport > 0 && content > viewport + 1;
    const offset = offsets.current.split;
    const remaining = content - viewport - offset;
    const top = overflow && offset > 1 ? SCROLL_FADE_SIZE : 0;
    const bottom = overflow && remaining > 1 ? SCROLL_FADE_SIZE : 0;
    setFades((previous) =>
      previous.top === top && previous.bottom === bottom
        ? previous
        : { top, bottom },
    );
  }, []);
  const trackScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    // Delayed scroll events can arrive after hiding or folding the pane.
    if (!scrollable.current || restoring.current) return;
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    offsets.current[mode] = Math.max(0, contentOffset.y);
    // Use one event's measurements so an old layout cannot leave an edge faded.
    bounds.current = {
      viewport: layoutMeasurement.height,
      content: contentSize.height,
    };
    if (columns) updateFades();
  };
  useLayoutEffect(() => {
    scrollable.current = visible;
    restoring.current = true;
    // Wait for the new pane bounds before restoring a formerly hidden scroll view.
    const frame = requestAnimationFrame(() => {
      if (visible) {
        const y = offsets.current[mode];
        scroll.current?.scrollTo({ y, animated: false });
      }
      restoring.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, visible, scroll]);

  return (
    <ScrollEdgeFade
      testID={`${testID}-frame`}
      inset={fadeInset}
      start={fadeInset ? fades.top : 0}
      end={fadeInset ? fades.bottom : 0}
      style={{
        flex: columnWidth === undefined ? 1 : undefined,
        width: columnWidth,
        minWidth: 0,
        minHeight: 0,
        display: visible ? 'flex' : 'none',
      }}
    >
      <ScrollView
        ref={scroll}
        testID={testID}
        scrollEnabled={visible}
        showsVerticalScrollIndicator={columns}
        fadingEdgeLength={{
          start: fadeInset ? fades.top : 0,
          end: fadeInset ? fades.bottom : 0,
        }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={[
          { flexGrow: 1, paddingVertical: fadeInset },
          contentPadding,
        ]}
        refreshControl={
          refreshControl && !visible
            ? React.cloneElement(refreshControl, {
                enabled: false,
                refreshing: false,
                onRefresh: undefined,
              })
            : refreshControl
        }
        onLayout={(event) => {
          bounds.current.viewport = event.nativeEvent.layout.height;
          viewport?.layout.set((n) => n + 1);
          updateFades();
        }}
        onContentSizeChange={(_, height) => {
          bounds.current.content = height;
          viewport?.layout.set((n) => n + 1);
          updateFades();
        }}
        onScroll={trackScroll}
        onMomentumScrollEnd={trackScroll}
        onScrollEndDrag={trackScroll}
        scrollEventThrottle={16}
        style={[
          { flex: 1, minWidth: 0, minHeight: 0 },
          // Each pane restores its own offset when the header changes parent.
          Platform.OS === 'web' &&
            ({
              overflowAnchor: 'none',
              overscrollBehaviorY: 'contain',
            } as ViewStyle),
        ]}
      >
        <SceneActive.Provider value={active && visible}>
          <GlassViewportContext.Provider value={viewport}>
            {visible && header}
            {children}
          </GlassViewportContext.Provider>
        </SceneActive.Provider>
      </ScrollView>
    </ScrollEdgeFade>
  );
}

export default function WeatherWorkspace() {
  const {
    theme,
    cityName,
    lastUpdated,
    refreshWeather,
    loading,
    currentWeather,
    forecast,
  } = useWeather();
  const pane = useWeatherPane();
  const { rail, columns, contentWidth, fontScale } = useAdaptiveLayout();
  const router = useRouter();
  const now = useNow();
  const currentVisible = columns || pane === 'current';
  const [workspace, setWorkspace] = useState<LayoutRectangle>();
  const columnWidth = columns
    ? Math.max(0, ((workspace?.width || contentWidth - 32) - PANE_GAP) / 2)
    : undefined;
  const currentWidth = columnWidth ?? contentWidth - 32;
  const compactHero = currentWidth <= 308;
  const heroInset = compactHero ? 0 : 8;
  const stackReadings =
    fontScale > 1 && currentWidth - 2 * heroInset < 270 * fontScale;
  const citySize = 20 * fontScale;
  const cityLineHeight = Math.ceil(1.2 * citySize);
  const [hero, setHero] = useState<LayoutRectangle>();
  const [bodyOrigin, setBodyOrigin] =
    useState<Pick<LayoutRectangle, 'x' | 'y'>>();
  const [hourlyHeight, setHourlyHeight] = useState(0);
  const [readings, setReadings] = useState<LayoutRectangle[]>();
  const [titleWidth, setTitleWidth] = useState<number>();
  const currentScroll = useSharedValue(0);
  const forecastScroll = useSharedValue(0);
  const airScroll = useSharedValue(0);
  const heroOpening = useMemo(() => {
    // The phone header scrolls above the body. In split view the panes begin
    // immediately below the fixed header, at the workspace origin.
    const origin = columns ? workspace : bodyOrigin;
    if (!currentWeather || !currentVisible || !origin || !hero?.width) return;
    return {
      frame: { ...hero, x: origin.x + hero.x, y: origin.y + hero.y },
      readings: readings ?? [
        { x: 0, y: 0, width: hero.width, height: hero.height },
      ],
      titleWidth,
      scroll: columns ? currentScroll : undefined,
    };
  }, [
    currentWeather,
    currentVisible,
    bodyOrigin,
    workspace,
    hero,
    readings,
    titleWidth,
    columns,
    currentScroll,
  ]);
  const forecastVisible =
    pane === 'forecast' || (columns && pane === 'current');
  const airVisible = pane === 'air-quality';
  const alignForecast =
    columns && forecastVisible && !!forecast && !!currentWeather;
  const visibleScroll = currentVisible
    ? currentScroll
    : airVisible
      ? airScroll
      : forecastScroll;
  const minutes =
    lastUpdated === null
      ? null
      : Math.max(0, Math.floor((now - lastUpdated) / 60000));
  const updated =
    minutes === null
      ? 'Never'
      : minutes < 1
        ? 'Just now'
        : minutes < 60
          ? `${minutes}m ago`
          : minutes < 1440
            ? `${Math.floor(minutes / 60)}h ago`
            : new Date(lastUpdated!).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });
  const title = currentVisible ? (
    <View
      style={{
        alignSelf: 'flex-start',
        maxWidth: '100%',
        paddingStart: heroInset,
      }}
      onLayout={({ nativeEvent }) => setTitleWidth(nativeEvent.layout.width)}
    >
      <View style={s.location}>
        <View style={[s.pin, { height: cityLineHeight }]}>
          <MapPin size={19 * fontScale} color={theme.heroText} />
        </View>
        <Text
          accessibilityRole="header"
          allowFontScaling={false}
          style={[
            s.city,
            heroLetterShadow,
            {
              color: theme.heroText,
              fontSize: citySize,
              lineHeight: cityLineHeight,
              letterSpacing: -0.5 * fontScale,
            },
          ]}
        >
          {cityName || 'Weather'}
        </Text>
      </View>
      <Text
        style={[s.updated, heroLetterShadow, { color: theme.heroSecondary }]}
      >
        Updated {updated}
      </Text>
    </View>
  ) : airVisible ? (
    'Air Quality'
  ) : (
    'Weather Forecast'
  );
  const paneSwitcher = rail ? (
    <GlassSurface
      theme={theme}
      navigation
      style={[
        s.switcher,
        !columns && { marginBottom: 12, alignSelf: 'flex-end' },
      ]}
    >
      {(['current', 'forecast', 'air-quality'] as const)
        .filter((item) => !columns || item !== 'current')
        .map((item) => {
          const selected =
            item === pane ||
            (columns && pane === 'current' && item === 'forecast');
          return (
            <Pressable
              key={item}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              aria-selected={selected}
              onPress={() =>
                router.navigate(item === 'current' ? '/' : `/${item}`)
              }
              style={[
                s.choice,
                selected && { backgroundColor: theme.selection },
              ]}
            >
              <Text
                style={{
                  color: selected ? theme.text : theme.textSecondary,
                  fontSize: 14,
                  fontWeight: selected ? '700' : '500',
                }}
              >
                {item === 'current'
                  ? 'Current'
                  : item === 'forecast'
                    ? 'Forecast'
                    : 'Air quality'}
              </Text>
            </Pressable>
          );
        })}
    </GlassSurface>
  ) : null;
  return (
    <ScrollingScreen
      theme={theme}
      title={title}
      heroOpening={heroOpening}
      fillViewport={columns}
      paneScroll={columns ? undefined : visibleScroll}
      titleAlign={currentVisible ? 'left' : 'center'}
      headerTrailing={columns ? paneSwitcher : undefined}
      showSettings={!rail && pane === 'current'}
      bottomInset={!rail && airVisible}
      onBack={
        !rail && airVisible
          ? () => (router.canGoBack() ? router.back() : router.replace('/'))
          : undefined
      }
      onRefresh={refreshWeather}
      refreshBusy={loading}
    >
      {({ refreshControl, header, contentPadding }) => {
        const paneLayout = {
          columns,
          refreshControl,
          contentPadding,
          header: header && (
            <>
              {header}
              {paneSwitcher}
            </>
          ),
        };
        return (
          <View
            testID="weather-workspace"
            onLayout={({ nativeEvent }) => setWorkspace(nativeEvent.layout)}
            style={{
              flexDirection: columns ? 'row' : 'column',
              flex: 1,
              minHeight: 0,
              gap: PANE_GAP,
              alignItems: 'stretch',
            }}
          >
            <WeatherScrollPane
              {...paneLayout}
              visible={currentVisible}
              columnWidth={columnWidth}
              testID="current-pane"
              scrollOffset={currentScroll}
            >
              <CurrentConditions
                compact={compactHero}
                heroInset={heroInset}
                stackReadings={stackReadings}
                minHeroHeight={alignForecast ? hourlyHeight : undefined}
                onLayout={({
                  nativeEvent: {
                    layout: { x, y },
                  },
                }) =>
                  setBodyOrigin((old) =>
                    old?.x === x && old.y === y ? old : { x, y },
                  )
                }
                onHeroLayout={({ nativeEvent }) => setHero(nativeEvent.layout)}
                onReadingsLayout={setReadings}
              />
            </WeatherScrollPane>
            <View
              testID="weather-detail-column"
              style={{
                flex: columns ? undefined : 1,
                width: columnWidth,
                minWidth: 0,
                minHeight: 0,
                display: forecastVisible || airVisible ? 'flex' : 'none',
              }}
            >
              <WeatherScrollPane
                {...paneLayout}
                visible={forecastVisible}
                testID="forecast-pane"
                scrollOffset={forecastScroll}
              >
                <ForecastContent
                  minHourlyHeight={alignForecast ? hero?.height : undefined}
                  onHourlyLayout={({ nativeEvent: { layout } }) => {
                    if (layout.height > 0) setHourlyHeight(layout.height);
                  }}
                />
              </WeatherScrollPane>
              <WeatherScrollPane
                {...paneLayout}
                visible={airVisible}
                testID="air-quality-pane"
                scrollOffset={airScroll}
              >
                <AirQualityContent />
              </WeatherScrollPane>
            </View>
          </View>
        );
      }}
    </ScrollingScreen>
  );
}
const s = StyleSheet.create({
  location: { flexDirection: 'row', gap: 7, alignItems: 'flex-start' },
  pin: { justifyContent: 'center' },
  city: {
    flexShrink: 1,
    minWidth: 0,
    fontWeight: '600',
    includeFontPadding: false,
  },
  updated: {
    fontSize: 14,
    lineHeight: 19,
    marginTop: 4,
    includeFontPadding: false,
    fontVariant: ['tabular-nums'],
  },
  switcher: {
    flexDirection: 'row',
    padding: 4,
  },
  choice: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: 14,
  },
});
