import React, {
  createContext,
  memo,
  useContext,
  useId,
  useLayoutEffect,
} from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Image as SkyImage,
  LinearGradient,
  Mask,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { WeatherTheme } from '../utils/weatherTheme';

export interface HeroOpening {
  x: number;
  width: number;
  bottom: number;
  textLeft: number;
  textRight: number;
  scroll?: SharedValue<number>;
}

export interface SceneOpening {
  insetTop?: number;
  headerBottom: number;
  settings?: boolean;
  hero?: HeroOpening;
  scroll?: SharedValue<number>;
}

// Only the visible route supplies geometry to the shared backdrop. Inactive
// routes keep their scroll positions and controls mounted.
export const SceneActive = createContext(true);
export const SceneOpeningContext = createContext<React.Dispatch<
  React.SetStateAction<SceneOpening | null>
> | null>(null);

export function useSceneOpening({
  headerBottom,
  settings,
  hero,
  scroll,
  insetTop,
}: SceneOpening) {
  const publish = useContext(SceneOpeningContext);
  const active = useContext(SceneActive);
  useLayoutEffect(() => {
    if (!publish || !active || headerBottom <= 0) return;
    const opening = {
      headerBottom,
      settings,
      hero,
      scroll,
      insetTop,
    };
    publish(opening);
    return () => publish((old) => (old === opening ? null : old));
  }, [publish, active, headerBottom, settings, hero, scroll, insetTop]);
}

interface QuietArea {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export function clearNightStars(
  width: number,
  height: number,
  hero: QuietArea,
  settingsBottom: number,
) {
  return Array.from({ length: 84 }, (_, i) => {
    const radius = (i % 9 === 0 ? 2 : i % 3 === 0 ? 1.5 : 1) / 2;
    const y =
      radius + (((i * 67.419 + 19) % 780) / 780) * (height - 2 * radius);
    let x = (((i * 37.137 + 7) % 100) / 100) * width;
    const inHeroBand = y + radius > hero.top && y - radius < hero.bottom;
    const leftGutter = Math.max(radius, hero.left - radius);
    const rightGutter = Math.min(width - radius, hero.right + radius);
    if (inHeroBand && x + radius > hero.left && x - radius < hero.right) {
      const fraction = (x - hero.left) / Math.max(1, hero.right - hero.left);
      x =
        fraction < 0.5
          ? leftGutter * (0.4 + fraction * 0.8)
          : rightGutter +
            (width - rightGutter) * (0.2 + (fraction - 0.5) * 1.2);
    }
    // Relocate out of the Settings corner last, into the available left gutter.
    if (y - radius < settingsBottom && x + radius > width * 0.7) {
      x = Math.min(width - x, inHeroBand ? leftGutter : width);
    }
    return {
      x: Math.max(radius, Math.min(width - radius, x)),
      y,
      radius,
      opacity: 0.4 + (i % 5) * 0.12,
    };
  });
}

const Clouds = memo(function Clouds({
  width,
  height,
  quiet,
  cover,
  fill,
}: {
  width: number;
  height: number;
  quiet: QuietArea;
  cover?: number;
  fill: string;
}) {
  // Real cloud cover changes how far banks reach in from the edges.
  const scale =
    cover !== undefined && Number.isFinite(cover)
      ? 0.65 + Math.min(100, Math.max(0, cover)) * 0.0035
      : 1;
  return [
    { edge: width, y: 0.14, room: width - quiet.right, opacity: 1 },
    { edge: 0, y: 0.36, room: quiet.left, opacity: 0.7 },
    { edge: width, y: 0.67, room: width * 0.43, opacity: 0.55 },
  ].map(({ edge, y, room, opacity }, i) => {
    const reach = Math.min(210, Math.max(8, room)) * scale;
    const h = Math.min(84, height * 0.11) * scale;
    const inward = edge === 0 ? 1 : -1;
    return (
      <G key={i} opacity={opacity}>
        <Ellipse
          cx={edge}
          cy={height * y}
          rx={reach * 0.91}
          ry={h}
          fill={fill}
        />
        <Ellipse
          cx={edge + inward * reach * 0.5}
          cy={height * y + h * 0.22}
          rx={reach * 0.5}
          ry={h * 0.68}
          fill={fill}
        />
        <Ellipse
          cx={edge + inward * reach * 0.18}
          cy={height * y - h * 0.28}
          rx={reach * 0.63}
          ry={h * 0.85}
          fill={fill}
        />
      </G>
    );
  });
});

export const WeatherScenery = memo(function WeatherScenery({
  theme,
  width,
  height,
  opening,
  cloudCover,
  railInset = 0,
}: {
  theme: WeatherTheme;
  width: number;
  height: number;
  opening: SceneOpening;
  cloudCover?: number;
  railInset?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const { hero, settings, scroll, insetTop = 0 } = opening;
  const headerBottom = opening.headerBottom + insetTop;
  const { condition, brightDay } = theme;
  const panoramic = railInset > 0;
  const travelsWithScreen = brightDay && !panoramic;
  const travel = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: travelsWithScreen
          ? -Math.min(height, scroll?.get() ?? 0)
          : 0,
      },
    ],
  }));
  const openingBottom = Math.max(
    1,
    Math.min(height, hero ? hero.bottom + insetTop : headerBottom),
  );
  const heroScroll = hero?.scroll;
  // Keep fine detail in the opening as the screen or the current pane scrolls.
  // The daytime phone scene already moves with the outer scroll view.
  const particleHeight = useDerivedValue(() => {
    const screenOffset = travelsWithScreen ? 0 : (scroll?.get() ?? 0);
    return Math.max(
      0,
      openingBottom - screenOffset - Math.max(0, heroScroll?.get() ?? 0),
    );
  });
  const particleClip = useAnimatedStyle(() => ({
    height: particleHeight.get(),
  }));
  if (!width || !height || (condition === 'clear' && !theme.isNight))
    return null;
  const quiet = hero
    ? {
        left: railInset + Math.min(hero.textLeft, hero.x + hero.width * 0.25),
        right: railInset + Math.max(hero.textRight, hero.x + hero.width * 0.75),
        top: 0,
        bottom: hero.bottom + insetTop,
      }
    : {
        left: panoramic ? railInset : width * 0.2,
        right: panoramic ? railInset + (width - railInset) * 0.5 : width * 0.8,
        top: 0,
        bottom: headerBottom,
      };
  const url = (name: string) => `url(#${id}-${name})`;
  const rain = ['rain', 'drizzle', 'thunderstorm'].includes(condition);
  const hasParticles = rain || condition === 'snow' || condition === 'clear';
  const particleRight = hero
    ? Math.min(width, railInset + hero.x + hero.width)
    : width;
  const clouds = condition !== 'clear' && condition !== 'mist';
  const photo = panoramic && clouds;
  const cover =
    condition === 'clouds' &&
    cloudCover !== undefined &&
    Number.isFinite(cloudCover)
      ? Math.min(100, Math.max(0, cloudCover)) / 100
      : 0.7;
  // The panorama is anchored to the window. Only the location of its lower
  // feather depends on the reading area. Both panes see the same bank.
  const bankHeight = Math.min(width / 3, height * 0.5);
  const bankBottom = bankHeight * (rain ? 0.86 : 0.66 + 0.23 * cover);
  const skyDepth = photo ? bankBottom : bankHeight;
  const fadeEnd = panoramic
    ? brightDay && hero
      ? Math.min(skyDepth, openingBottom)
      : skyDepth
    : openingBottom;
  const fadeStart =
    brightDay && panoramic
      ? Math.min(headerBottom, fadeEnd * 0.3)
      : fadeEnd * (170 / 280);
  const fieldHeight = brightDay ? fadeEnd : height;
  const density = panoramic ? Math.max(1, Math.min(2.5, width / 480)) : 1;
  const cloudOpacity =
    condition === 'clouds'
      ? 0.5 + 0.5 * cover
      : condition === 'snow' || condition === 'drizzle'
        ? 0.65
        : 1;
  const openingMask = (name: string) => (
    <>
      <LinearGradient
        id={`${id}-${name}-fade`}
        gradientUnits="userSpaceOnUse"
        x1="0"
        x2="0"
        y1={fadeStart}
        y2={fadeEnd}
      >
        <Stop offset="0" stopColor="white" />
        <Stop offset="1" stopColor="white" stopOpacity={0} />
      </LinearGradient>
      {panoramic && brightDay && (
        <LinearGradient
          id={`${id}-${name}-open-sky`}
          gradientUnits="userSpaceOnUse"
          x1={railInset}
          x2={width}
          y1={0}
          y2={0}
        >
          <Stop offset="0" stopColor="black" stopOpacity={0.96} />
          <Stop offset="0.22" stopColor="black" stopOpacity={0.94} />
          <Stop offset="0.64" stopColor="black" stopOpacity={0.12} />
          <Stop offset="1" stopColor="black" stopOpacity={0} />
        </LinearGradient>
      )}
      <Mask
        id={`${id}-${name}`}
        maskType="luminance"
        maskUnits="userSpaceOnUse"
        x={0}
        y={0}
        width={width}
        height={fadeEnd}
      >
        <Rect width={width} height={fadeEnd} fill={url(`${name}-fade`)} />
        {panoramic && brightDay && (
          <Rect width={width} height={fadeEnd} fill={url(`${name}-open-sky`)} />
        )}
      </Mask>
    </>
  );
  const waterGradient = (
    <LinearGradient id={id + '-water'} x1="0%" y1="0%" x2="0%" y2="100%">
      <Stop offset="0" stopColor="white" stopOpacity={0} />
      <Stop
        offset="0.5"
        stopColor="white"
        stopOpacity={condition === 'mist' ? 0.55 : 0.45}
      />
      <Stop offset="1" stopColor="white" stopOpacity={rain ? 0.9 : 0} />
    </LinearGradient>
  );
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, travel]}
    >
      <View
        renderToHardwareTextureAndroid={brightDay || panoramic}
        needsOffscreenAlphaCompositing
        style={{
          width,
          height: fieldHeight,
          opacity: brightDay ? (panoramic ? 0.4 : 0.5) : 0.3,
          overflow: 'hidden',
        }}
      >
        {condition !== 'clear' && (
          <Svg width={width} height={fieldHeight} accessible={false}>
            <Defs>
              {(brightDay || photo) && openingMask('opening')}
              {clouds && !panoramic && (
                <RadialGradient
                  id={id + '-cloud'}
                  cx="50%"
                  cy="50%"
                  rx="50%"
                  ry="50%"
                >
                  <Stop offset="0" stopColor="white" stopOpacity={0.9} />
                  <Stop offset="0.5" stopColor="white" stopOpacity={0.46} />
                  <Stop offset="1" stopColor="white" stopOpacity={0} />
                </RadialGradient>
              )}
              {condition === 'mist' && waterGradient}
            </Defs>
            <G mask={brightDay ? url('opening') : undefined}>
              {photo && (
                <SkyImage
                  href={
                    rain
                      ? require('../assets/weather/rain-clouds.webp')
                      : require('../assets/weather/cloud-bank.webp')
                  }
                  x={0}
                  y={bankBottom - bankHeight}
                  width={width}
                  height={bankHeight}
                  preserveAspectRatio="xMidYMin slice"
                  opacity={cloudOpacity}
                  mask={brightDay ? undefined : url('opening')}
                />
              )}
              {clouds && !panoramic && (
                <Clouds
                  width={width}
                  height={height}
                  quiet={quiet}
                  cover={condition === 'clouds' ? cloudCover : undefined}
                  fill={url('cloud')}
                />
              )}
              {condition === 'mist' &&
                [55, 240, 450].map((top) => (
                  <Rect
                    key={top}
                    x={-width * 0.1}
                    y={(top / 780) * height}
                    width={width * 1.2}
                    height={Math.min(130, height / 6)}
                    transform={`rotate(-5 ${width / 2} ${(top / 780) * height})`}
                    fill={url('water')}
                  />
                ))}
            </G>
          </Svg>
        )}
        {hasParticles && (
          <Animated.View
            testID="weather-particles"
            style={[
              {
                position: 'absolute',
                top: 0,
                left: railInset,
                width: Math.max(0, particleRight - railInset),
                overflow: 'hidden',
              },
              particleClip,
            ]}
          >
            <Svg
              width={width}
              height={fieldHeight}
              accessible={false}
              style={{ position: 'absolute', top: 0, left: -railInset }}
            >
              <Defs>
                {brightDay && openingMask('particle-opening')}
                {rain && waterGradient}
              </Defs>
              <G mask={brightDay ? url('particle-opening') : undefined}>
                {condition === 'clear' &&
                  clearNightStars(
                    width,
                    height,
                    quiet,
                    settings ? headerBottom + 8 : 0,
                  ).map((star, i) => (
                    <Circle
                      key={i}
                      cx={star.x}
                      cy={star.y}
                      r={star.radius}
                      fill="white"
                      opacity={star.opacity}
                    />
                  ))}
                {rain &&
                  Array.from(
                    {
                      length: Math.round(
                        (condition === 'drizzle' ? 16 : 32) * density,
                      ),
                    },
                    (_, i) => {
                      const x = (((i * 29 + 3) % 100) / 100) * width;
                      const y = (((i * 53 + 8) % 780) / 780) * height;
                      return (
                        <Rect
                          key={i}
                          x={x}
                          y={y}
                          width={1}
                          height={condition === 'drizzle' ? 12 : 19}
                          transform={`rotate(13 ${x} ${y})`}
                          fill={url('water')}
                          opacity={0.25 + (i % 4) * 0.13}
                        />
                      );
                    },
                  )}
                {rain &&
                  [0.08, 0.93, 0.97].map((fraction, i) => (
                    <Ellipse
                      key={i}
                      cx={fraction * width}
                      cy={((100 + i * 82) / 780) * height}
                      rx={3}
                      ry={5.5}
                      stroke="white"
                      strokeOpacity={0.65}
                      fill="none"
                    />
                  ))}
                {condition === 'snow' &&
                  Array.from({ length: Math.round(24 * density) }, (_, i) => (
                    <Circle
                      key={i}
                      cx={(((i * 31 + 5) % 100) / 100) * width}
                      cy={(((i * 61 + 12) % 790) / 790) * height}
                      r={(2 + (i % 3)) / 2}
                      opacity={0.4 + (i % 3) * 0.2}
                      fill="white"
                    />
                  ))}
              </G>
            </Svg>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
});
