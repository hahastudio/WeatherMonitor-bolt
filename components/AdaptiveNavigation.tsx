import React, { useState } from 'react';
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
import { WeatherBackdrop } from './GlassSurface';

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
  const { theme } = useWeather();
  const layout = useAdaptiveLayout();
  const insets = useSafeAreaInsets();
  // Settings sits over the gradient's brighter end once the rail is transparent.
  const endChannels = [1, 3, 5].map((start) => {
    const channel =
      parseInt(theme.gradientEnd.slice(start, start + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  const endLuminance =
    endChannels[0] * 0.2126 + endChannels[1] * 0.7152 + endChannels[2] * 0.0722;
  const footerColor = endLuminance > 0.179 ? '#000000' : '#FFFFFF';
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
  const button = ({ name, label, Icon }: (typeof destinations)[number]) => {
    const selected =
      layout.rail && name === 'index' ? weatherActive : active === name;
    const foreground = layout.rail
      ? name === 'settings'
        ? footerColor
        : theme.heroText
      : selected
        ? theme.primary
        : theme.textSecondary;
    return (
      <Pressable
        key={name}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        aria-selected={selected}
        onPress={() => actions.navigate(name)}
        style={[
          styles.item,
          !layout.rail && styles.bottomItem,
          !layout.rail && name === 'index' && styles.bottomFirstItem,
          !layout.rail && name === 'map' && styles.bottomLastItem,
          selected && {
            backgroundColor: layout.rail
              ? name === 'settings' && footerColor === '#000000'
                ? 'rgba(0, 0, 0, 0.08)'
                : 'rgba(255, 255, 255, 0.18)'
              : theme.primary + '18',
          },
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
  return (
    <WeatherBackdrop theme={theme}>
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          paddingLeft: layout.rail ? insets.left : 0,
        }}
      >
        {layout.rail && (
          <View
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
          </View>
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
                        {descriptors[route.key].render()}
                      </View>
                    )
                  );
                })}
            </WeatherPaneContext.Provider>
          </FloatingNavigationHeightContext.Provider>
        </View>
      </View>
      {showBottom && (
        <View
          onLayout={(event) => setBarHeight(event.nativeEvent.layout.height)}
          style={[
            styles.bottom,
            {
              backgroundColor: theme.isDark ? '#06182F' : '#FFFFFF',
              borderColor: theme.isDark ? theme.glassBorder : theme.divider,
              bottom: Math.max(insets.bottom, 8),
              minHeight: layout.navigationHeight,
              left: insets.left + 12,
              right: insets.right + 12,
            },
          ]}
        >
          {destinations.filter((d) => d.name !== 'settings').map(button)}
        </View>
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
  },
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
    borderWidth: bottomBarBorderWidth,
    shadowColor: '#001632',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
});
