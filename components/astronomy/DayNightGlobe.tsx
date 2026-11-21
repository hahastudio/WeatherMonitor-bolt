import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, Text, View } from 'react-native';
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import type { EarthPoint } from '../../types/astronomy';
import { wrapLongitude } from '../../services/astronomyService';
import { coordinateLabel, projectGlobe } from '../../utils/globeGeometry';
import type { WeatherTheme } from '../../utils/weatherTheme';
import { skyColors, skyStyles as s } from './skyStyles';

export const DayNightGlobe = memo(function DayNightGlobe({
  latitude,
  longitude,
  subsolar,
  theme,
  expanded = false,
  fitHeight = false,
}: {
  latitude: number;
  longitude: number;
  subsolar: EarthPoint;
  theme: WeatherTheme;
  expanded?: boolean;
  fitHeight?: boolean;
}) {
  const [camera, setCamera] = useState<EarthPoint>({
    latitudeDeg: latitude,
    longitudeDeg: longitude,
  });
  const current = useRef(camera);
  current.current = camera;
  const dragStart = useRef(camera);
  useEffect(
    () => setCamera({ latitudeDeg: latitude, longitudeDeg: longitude }),
    [latitude, longitude],
  );
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderGrant: () => {
          dragStart.current = current.current;
        },
        onPanResponderMove: (_, g) =>
          setCamera({
            longitudeDeg: wrapLongitude(
              dragStart.current.longitudeDeg - g.dx * 0.6,
            ),
            latitudeDeg: Math.max(
              -90,
              Math.min(90, dragStart.current.latitudeDeg + g.dy * 0.6),
            ),
          }),
        onPanResponderTerminationRequest: () => true,
      }),
    [],
  );
  const paths = useMemo(
    () =>
      projectGlobe(camera, subsolar, {
        latitudeDeg: latitude,
        longitudeDeg: longitude,
      }),
    [camera, subsolar, latitude, longitude],
  );
  const colors = skyColors(theme);
  const rotate = (lon: number, lat = 0) =>
    setCamera((c) => ({
      longitudeDeg: wrapLongitude(c.longitudeDeg + lon),
      latitudeDeg: Math.max(-90, Math.min(90, c.latitudeDeg + lat)),
    }));
  const actionStyle = [
    s.button,
    { borderColor: colors.line, backgroundColor: theme.surface },
  ];
  return (
    <View
      testID="day-night-globe"
      style={{ flex: expanded ? 1 : undefined, marginTop: 14 }}
    >
      <View
        {...pan.panHandlers}
        style={{
          flex: expanded ? 1 : undefined,
          minHeight: fitHeight ? 120 : 220,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`Earth at the selected time. Shaded area is night. Sun overhead at ${coordinateLabel(subsolar)}. Your location is ${paths.observer ? 'marked with a pin' : 'on the far side'}. Sun marker ${paths.subsolar ? 'visible as a circle' : 'on the far side'}. Camera centred on ${coordinateLabel(camera)}.`}
      >
        <Svg
          width="100%"
          height={expanded ? '100%' : 220}
          style={expanded ? { position: 'absolute' } : undefined}
          viewBox="-2 -12 224 232"
          accessible={false}
        >
          <Circle cx={110} cy={110} r={104} fill={colors.sea} />
          <Path d={paths.land} fill={colors.land} />
          <Path
            d={paths.grid}
            stroke={theme.textSecondary}
            strokeWidth={0.4}
            opacity={0.35}
            fill="none"
          />
          <Path d={paths.night} fill={colors.night} opacity={0.65} />
          <Circle cx={110} cy={110} r={104} fill="none" stroke={colors.line} />
          {paths.subsolar && (
            <Circle
              testID="subsolar-marker"
              cx={paths.subsolar[0]}
              cy={paths.subsolar[1]}
              r={5}
              fill={colors.sun}
              stroke={theme.surface}
              strokeWidth={1.5}
            />
          )}
          {paths.observer && (
            <G
              testID="observer-marker"
              transform={`translate(${paths.observer[0]} ${paths.observer[1]})`}
            >
              <Path
                d="M 0 0 C -2 -3 -6 -6 -6 -10 A 6 6 0 0 1 6 -10 C 6 -6 2 -3 0 0 Z"
                fill={theme.text}
                stroke={theme.background}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <Circle cx={0} cy={-10} r={2} fill={theme.background} />
            </G>
          )}
        </Svg>
      </View>
      <View style={[s.row, { justifyContent: 'center', gap: 4 }]}>
        {[
          { label: 'Rotate globe west', lon: -30, lat: 0, Icon: ChevronLeft },
          { label: 'Rotate globe east', lon: 30, lat: 0, Icon: ChevronRight },
          { label: 'Rotate globe north', lon: 0, lat: 20, Icon: ChevronUp },
          { label: 'Rotate globe south', lon: 0, lat: -20, Icon: ChevronDown },
        ].map(({ label, lon, lat, Icon }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label}
            onPress={() => rotate(lon, lat)}
            style={actionStyle}
          >
            <Icon size={18} color={theme.text} />
          </Pressable>
        ))}
      </View>
      <View style={[s.row, { justifyContent: 'center', marginTop: 8 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() =>
            setCamera({ latitudeDeg: latitude, longitudeDeg: longitude })
          }
          style={actionStyle}
        >
          <Text style={{ color: theme.text }}>My location</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setCamera(subsolar)}
          style={actionStyle}
        >
          <Text style={{ color: theme.text }}>Sun overhead</Text>
        </Pressable>
      </View>
    </View>
  );
});
