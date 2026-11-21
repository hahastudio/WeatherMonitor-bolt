import React, {
  useContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutRectangle,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type RefreshControlProps,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  useAnimatedRef,
  useScrollOffset,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { heroLetterShadow } from '../../utils/weatherTheme';
import { Clock, MapPin } from 'lucide-react-native';
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
  children,
}: React.PropsWithChildren<{
  columns: boolean;
  columnWidth?: number;
  visible: boolean;
  testID: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  scrollOffset?: SharedValue<number>;
}>) {
  const reducedTransparency = useReducedTransparency();
  const active = useContext(SceneActive);
  const parentViewport = useContext(GlassViewportContext);
  const scroll = useAnimatedRef<ScrollView>();
  const paneOffset = useScrollOffset(
    columns && visible ? scroll : null,
    scrollOffset,
  );
  const viewport = useMemo(
    () =>
      columns && parentViewport
        ? { ...parentViewport, scroll: paneOffset }
        : parentViewport,
    [columns, parentViewport, paneOffset],
  );
  const offset = useRef(0);
  const bounds = useRef({ viewport: 0, content: 0 });
  const [fades, setFades] = useState({ top: 0, bottom: 0 });
  const restoring = useRef(false);
  const scrollable = useRef(columns && visible);
  const fadeInset = columns && !reducedTransparency ? SCROLL_FADE_SIZE : 0;
  const updateFades = useCallback(() => {
    const { viewport, content } = bounds.current;
    const overflow = viewport > 0 && content > viewport + 1;
    const remaining = content - viewport - offset.current;
    const top = overflow && offset.current > 1 ? SCROLL_FADE_SIZE : 0;
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
    offset.current = Math.max(0, contentOffset.y);
    // Use one event's measurements so an old layout cannot leave an edge faded.
    bounds.current = {
      viewport: layoutMeasurement.height,
      content: contentSize.height,
    };
    updateFades();
  };
  useLayoutEffect(() => {
    scrollable.current = columns && visible;
    restoring.current = true;
    // Wait for the new pane bounds before restoring a formerly hidden scroll view.
    const frame = requestAnimationFrame(() => {
      if (visible)
        scroll.current?.scrollTo({
          y: columns ? offset.current : 0,
          animated: false,
        });
      restoring.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [columns, visible, scroll]);

  return (
    <ScrollEdgeFade
      testID={`${testID}-frame`}
      inset={fadeInset}
      start={fadeInset ? fades.top : 0}
      end={fadeInset ? fades.bottom : 0}
      style={{
        flexGrow: columns && columnWidth === undefined ? 1 : 0,
        flexShrink: columns && columnWidth === undefined ? 1 : 0,
        flexBasis: columns && columnWidth === undefined ? 0 : 'auto',
        width: columnWidth,
        minWidth: 0,
        minHeight: 0,
        display: visible ? 'flex' : 'none',
      }}
    >
      <ScrollView
        ref={scroll}
        testID={testID}
        scrollEnabled={columns}
        nestedScrollEnabled={columns}
        showsVerticalScrollIndicator={columns}
        fadingEdgeLength={{
          start: fadeInset ? fades.top : 0,
          end: fadeInset ? fades.bottom : 0,
        }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: fadeInset }}
        refreshControl={
          refreshControl && !(columns && visible)
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
        style={{
          flexGrow: columns ? 1 : 0,
          flexShrink: columns ? 1 : 0,
          flexBasis: columns ? 0 : 'auto',
          minWidth: 0,
          minHeight: 0,
          display: visible ? 'flex' : 'none',
        }}
      >
        <SceneActive.Provider value={active && visible}>
          <GlassViewportContext.Provider value={viewport}>
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
  } = useWeather();
  const pane = useWeatherPane();
  const { rail, columns, contentWidth } = useAdaptiveLayout();
  const router = useRouter();
  const now = useNow();
  const currentVisible = columns || pane === 'current';
  const [workspace, setWorkspace] = useState<LayoutRectangle>();
  const columnWidth = columns
    ? Math.max(0, ((workspace?.width || contentWidth - 32) - PANE_GAP) / 2)
    : undefined;
  const [hero, setHero] = useState<LayoutRectangle>();
  const [text, setText] = useState<LayoutRectangle>();
  const currentScroll = useSharedValue(0);
  const heroOpening = useMemo(() => {
    if (
      !currentWeather ||
      !currentVisible ||
      !workspace ||
      !hero?.width ||
      !text?.width
    )
      return;
    const x = workspace.x + hero.x;
    const top = workspace.y + hero.y;
    // Text is measured inside the hero's padded row, including font scaling and wrapping.
    const textLeft = x + 8 + text.x;
    return {
      x,
      width: hero.width,
      bottom: top + hero.height,
      textLeft,
      textRight: textLeft + text.width,
      scroll: columns ? currentScroll : undefined,
    };
  }, [
    currentWeather,
    currentVisible,
    workspace,
    hero,
    text,
    columns,
    currentScroll,
  ]);
  const forecastVisible =
    pane === 'forecast' || (columns && pane === 'current');
  const airVisible = pane === 'air-quality';
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
  const title = currentVisible
    ? cityName || 'Weather'
    : airVisible
      ? 'Air Quality'
      : 'Weather Forecast';
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
      titleAlign={columns ? 'left' : 'center'}
      headerTrailing={columns ? paneSwitcher : undefined}
      titleIcon={
        currentVisible ? <MapPin size={20} color={theme.heroText} /> : undefined
      }
      titleStyle={
        currentVisible ? { fontSize: 18, fontWeight: '600' } : undefined
      }
      showSettings={!rail && pane === 'current'}
      bottomInset={!rail && airVisible}
      onBack={
        !rail && airVisible
          ? () => (router.canGoBack() ? router.back() : router.replace('/'))
          : undefined
      }
      onRefresh={refreshWeather}
      refreshBusy={loading}
      subtitle={
        currentVisible ? (
          <View style={[s.updated, rail && { justifyContent: 'flex-start' }]}>
            <Clock size={14} color={theme.heroSecondary} />
            <Text
              style={{
                ...heroLetterShadow,
                color: theme.heroSecondary,
                fontSize: 14,
              }}
            >
              Updated {updated}
            </Text>
          </View>
        ) : undefined
      }
    >
      {(refreshControl) => (
        <>
          {!columns && paneSwitcher}

          <View
            testID="weather-workspace"
            onLayout={({ nativeEvent }) => setWorkspace(nativeEvent.layout)}
            style={{
              flexDirection: columns ? 'row' : 'column',
              flex: columns ? 1 : undefined,
              minHeight: 0,
              gap: PANE_GAP,
              alignItems: 'stretch',
            }}
          >
            <WeatherScrollPane
              columns={columns}
              visible={currentVisible}
              columnWidth={columnWidth}
              testID="current-pane"
              refreshControl={refreshControl}
              scrollOffset={currentScroll}
            >
              <CurrentConditions
                onHeroLayout={({ nativeEvent }) => setHero(nativeEvent.layout)}
                onTextLayout={({ nativeEvent }) => setText(nativeEvent.layout)}
              />
            </WeatherScrollPane>
            <View
              testID="weather-detail-column"
              style={{
                width: columnWidth,
                minWidth: 0,
                minHeight: 0,
                display: forecastVisible || airVisible ? 'flex' : 'none',
              }}
            >
              <WeatherScrollPane
                columns={columns}
                visible={forecastVisible}
                testID="forecast-pane"
                refreshControl={refreshControl}
              >
                <ForecastContent />
              </WeatherScrollPane>
              <WeatherScrollPane
                columns={columns}
                visible={airVisible}
                testID="air-quality-pane"
                refreshControl={refreshControl}
              >
                <AirQualityContent />
              </WeatherScrollPane>
            </View>
          </View>
        </>
      )}
    </ScrollingScreen>
  );
}
const s = StyleSheet.create({
  updated: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
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
