import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type NavigatorContentProps } from 'expo-router';
import {
  Calendar,
  ChartLine,
  Map,
  Settings,
  Sun,
  SunMoon,
} from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import {
  WeatherPaneContext,
  type WeatherPane,
} from '../contexts/WeatherPaneContext';
import {
  useAdaptiveLayout,
  FloatingNavigationHeightContext,
} from '../hooks/useAdaptiveLayout';
import { GlassSurface, WeatherBackdrop } from './GlassSurface';
import { SceneActive } from './WeatherScenery';

const bottomBarRadius = 24;
const bottomBarPadding = 4;
const bottomBarBorderWidth = 1;
// Keep the outer highlight corners concentric with the bar's inset edge.
const bottomItemOuterRadius =
  bottomBarRadius - bottomBarPadding - bottomBarBorderWidth;

const destinations = [
  { name: 'index', label: 'Weather', Icon: Sun },
  { name: 'forecast', label: 'Forecast', Icon: Calendar },
  { name: 'charts', label: 'Charts', Icon: ChartLine },
  { name: 'sky', label: 'Sky', Icon: SunMoon },
  { name: 'map', label: 'Map', Icon: Map },
  { name: 'settings', label: 'Settings', Icon: Settings },
];

/** Route identity and mounted scenes stay stable; only their presentation changes. */
export function AdaptiveNavigation({
  state,
  descriptors,
  actions,
}: NavigatorContentProps<{ title?: string }>) {
  const { theme, currentWeather } = useWeather();
  const reportedWeather = currentWeather?.weather?.[0]?.main;
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  const active = state.routes[state.index].name;
  const weatherActive = ['index', 'forecast', 'air-quality'].includes(active);
  const scene = weatherActive ? 'index' : active;
  const [barHeight, setBarHeight] = useState<number | null>(null);
  const [visited, setVisited] = useState<string[]>([scene]);
  if (!visited.includes(scene)) setVisited([...visited, scene]);
  const pane: WeatherPane =
    active === 'forecast' || active === 'air-quality' ? active : 'current';
  const showBottom =
    !layout.rail && !['settings', 'air-quality'].includes(active);
  const largeLabels = !layout.rail && layout.fontScale > 1.2;
  const tabScroll = useRef<ScrollView>(null);
  const tabCenters = useRef<Record<string, number>>({});
  const barMargin = largeLabels ? 8 : 12;
  const barViewport = layout.contentWidth - 2 * (barMargin + bottomBarPadding);
  const revealTab = useCallback(
    (center: number) => {
      tabScroll.current?.scrollTo({
        x: Math.max(0, center - barViewport / 2),
        animated: false,
      });
    },
    [barViewport],
  );
  useEffect(() => {
    const center = tabCenters.current[active];
    if (largeLabels && center !== undefined) revealTab(center);
  }, [active, largeLabels, revealTab]);
  const button = ({ name, label, Icon }: (typeof destinations)[number]) => {
    const selected =
      layout.rail && name === 'index' ? weatherActive : active === name;
    const foreground = selected ? theme.text : theme.textSecondary;
    return (
      <Pressable
        key={name}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        aria-selected={selected}
        onPress={() => actions.navigate(name)}
        onLayout={
          largeLabels
            ? ({
                nativeEvent: {
                  layout: { x, width },
                },
              }) => {
                const center = x + width / 2;
                tabCenters.current[name] = center;
                if (selected) revealTab(center);
              }
            : undefined
        }
        style={[
          styles.item,
          !layout.rail && (largeLabels ? styles.largeItem : styles.bottomItem),
          !layout.rail && name === 'index' && styles.bottomFirstItem,
          !layout.rail && name === 'map' && styles.bottomLastItem,
          selected && { backgroundColor: theme.selection },
        ]}
      >
        <Icon size={22} color={foreground} />
        <Text
          style={{
            color: foreground,
            fontSize: 12,
            fontWeight: selected ? '700' : '500',
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </Pressable>
    );
  };
  const bottomButtons = showBottom
    ? destinations.filter((d) => d.name !== 'settings').map(button)
    : null;
  return (
    <WeatherBackdrop
      theme={theme}
      showScenery={
        !!reportedWeather &&
        (theme.condition !== 'clear' || /clear|sunny/i.test(reportedWeather))
      }
      cloudCover={currentWeather?.clouds?.all}
      railInset={layout.rail ? layout.railWidth + insets.left : 0}
    >
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          paddingLeft: layout.rail ? insets.left : 0,
        }}
      >
        {layout.rail && (
          <GlassSurface
            theme={theme}
            navigation
            style={[
              styles.rail,
              {
                width: layout.railWidth,
                paddingTop: insets.top + 12,
                paddingBottom: insets.bottom + 12,
              },
            ]}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, gap: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {destinations
                .filter((d) => !['forecast', 'settings'].includes(d.name))
                .map(button)}
              <View style={{ flex: 1, minHeight: 20 }} />
              {button(destinations[5])}
            </ScrollView>
          </GlassSurface>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <FloatingNavigationHeightContext.Provider value={barHeight}>
            <WeatherPaneContext.Provider value={pane}>
              {state.routes
                .filter(
                  (route) => !['forecast', 'air-quality'].includes(route.name),
                )
                .map((route) => {
                  const visible = route.name === scene;
                  return (
                    (visited.includes(route.name) || visible) && (
                      <View
                        key={route.key}
                        testID={`scene-${route.name}`}
                        style={{ flex: 1, display: visible ? 'flex' : 'none' }}
                        accessibilityElementsHidden={!visible}
                        importantForAccessibility={
                          visible ? 'auto' : 'no-hide-descendants'
                        }
                      >
                        <SceneActive.Provider value={visible}>
                          {descriptors[route.key].render()}
                        </SceneActive.Provider>
                      </View>
                    )
                  );
                })}
            </WeatherPaneContext.Provider>
          </FloatingNavigationHeightContext.Provider>
        </View>
      </View>
      {showBottom && (
        <GlassSurface
          theme={theme}
          navigation
          onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
          style={[
            styles.bottom,
            {
              bottom: Math.max(insets.bottom, 8),
              minHeight: layout.navigationHeight,
              left: insets.left + barMargin,
              right: insets.right + barMargin,
            },
          ]}
        >
          {largeLabels ? (
            <ScrollView
              ref={tabScroll}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
              style={{ flex: 1 }}
            >
              {bottomButtons}
            </ScrollView>
          ) : (
            bottomButtons
          )}
        </GlassSurface>
      )}
    </WeatherBackdrop>
  );
}
const styles = StyleSheet.create({
  item: {
    minHeight: 52,
    minWidth: 44,
    paddingVertical: 8,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 14,
  },
  rail: {
    paddingHorizontal: 5,
    borderRadius: 0,
  },
  largeItem: { flexGrow: 1, flexShrink: 0, paddingHorizontal: 5 },
  bottomItem: {
    flex: 1,
  },
  bottomFirstItem: {
    borderTopLeftRadius: bottomItemOuterRadius,
    borderBottomLeftRadius: bottomItemOuterRadius,
  },
  bottomLastItem: {
    borderTopRightRadius: bottomItemOuterRadius,
    borderBottomRightRadius: bottomItemOuterRadius,
  },
  bottom: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'stretch',
    padding: bottomBarPadding,
    borderRadius: bottomBarRadius,
  },
});
