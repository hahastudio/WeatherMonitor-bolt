import React, {
  createContext,
  memo,
  useContext,
  useId,
  useLayoutEffect,
} from 'react';
import { StyleSheet, View, type LayoutRectangle } from 'react-native';
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
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';
import type { WeatherTheme } from '../utils/weatherTheme';

export interface HeroOpening {
  frame: LayoutRectangle;
  /** Temperature, condition, and supporting readings, relative to the hero. */
  readings: LayoutRectangle[];
  titleWidth?: number;
  scroll?: SharedValue<number>;
}

export interface SceneOpening {
  insetTop?: number;
  headerBottom: number;
  settings?: LayoutRectangle;
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

function readingAreas(width: number, railInset: number, opening: SceneOpening) {
  const { hero, settings, insetTop = 0, headerBottom } = opening;
  const left = railInset + (hero?.frame.x ?? 0);
  const contentWidth = width - railInset;
  const areas: LayoutRectangle[] = [
    { x: 0, y: 0, width, height: insetTop },
    hero
      ? {
          x: left,
          y: insetTop,
          width: hero.titleWidth ?? hero.frame.width,
          height: headerBottom,
        }
      : {
          x: settings || railInset ? left : left + contentWidth * 0.15,
          y: insetTop,
          width: contentWidth * 0.7,
          height: headerBottom,
        },
  ];
  if (settings)
    areas.push({
      ...settings,
      x: railInset + settings.x,
      y: insetTop + settings.y,
    });
  if (hero) {
    if (railInset && !hero.scroll && hero.frame.y > headerBottom)
      areas.push({
        x: railInset,
        y: insetTop + headerBottom,
        width: contentWidth,
        height: hero.frame.y - headerBottom,
      });
    for (const box of hero.readings)
      areas.push({
        ...box,
        x: left + box.x,
        y: insetTop + hero.frame.y + box.y,
      });
  }
  return areas;
}

function hasRoom(x: number, y: number, gap: number, areas: LayoutRectangle[]) {
  return areas.every(
    (box) =>
      x <= box.x - gap ||
      x >= box.x + box.width + gap ||
      y <= box.y - gap ||
      y >= box.y + box.height + gap,
  );
}

function openSkyPoints(
  width: number,
  height: number,
  count: number,
  areas: LayoutRectangle[],
  gap: number,
) {
  const points = [];
  // A low-discrepancy sequence fills the sky evenly without lining up the
  // particles in rows. Skip occupied positions instead of crowding the edges.
  for (let i = 0; points.length < count && i < count * 8; i++) {
    const x = 2 + ((0.38 + i * 0.75487767) % 1) * (width - 4);
    const y = 2 + ((0.12 + i * 0.56984029) % 1) * (height - 4);
    if (hasRoom(x, y, gap, areas)) points.push({ x, y, seed: i });
  }
  return points;
}

export function clearNightStars(
  width: number,
  height: number,
  areas: LayoutRectangle[],
) {
  return openSkyPoints(width, height, 84, areas, 14).map(({ x, y, seed }) => ({
    x,
    y,
    radius: seed % 9 === 0 ? 1.25 : seed % 3 === 0 ? 1 : 0.75,
    opacity: 0.56 + (seed % 5) * 0.105,
  }));
}

// Soft shafts of different widths share a light source above the upper-left edge.
const sunlightRays = [
  { angle: 19, spread: 0.038, opacity: 0.5 },
  { angle: 31, spread: 0.07, opacity: 0.94 },
  { angle: 47, spread: 0.032, opacity: 0.7 },
  { angle: 62, spread: 0.055, opacity: 0.82 },
];

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
  const { hero, scroll, insetTop = 0 } = opening;
  const headerBottom = opening.headerBottom + insetTop;
  const { condition, brightDay } = theme;
  const panoramic = railInset > 0;
  const starry = condition === 'clear' && theme.isNight;
  const sunny = condition === 'clear' && !theme.isNight;
  const travelsWithScreen = starry || (!panoramic && (brightDay || sunny));
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
    Math.min(
      height,
      hero ? hero.frame.y + hero.frame.height + insetTop : headerBottom,
    ),
  );
  const heroScroll = hero?.scroll;
  const particleTop = starry && heroScroll ? headerBottom : 0;
  // Keep fine detail in the opening as the screen or the current pane scrolls.
  // On phones the daylight scene already moves with the scrolling header.
  const particleHeight = useDerivedValue(() => {
    const screenOffset = travelsWithScreen ? 0 : (scroll?.get() ?? 0);
    return Math.max(
      0,
      openingBottom - screenOffset - Math.max(0, heroScroll?.get() ?? 0),
    );
  });
  const particleClip = useAnimatedStyle(() => ({
    height: Math.max(0, particleHeight.get() - particleTop),
  }));
  const starScroll = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.max(0, heroScroll?.get() ?? 0) }],
  }));
  if (!width || !height) return null;
  const url = (name: string) => `url(#${id}-${name})`;
  const rain = ['rain', 'drizzle', 'thunderstorm'].includes(condition);
  const hasParticles = rain || condition === 'snow' || starry;
  const particleRight =
    panoramic && hero
      ? Math.min(width, railInset + hero.frame.x + hero.frame.width)
      : width;
  const clouds = condition !== 'clear' && condition !== 'mist';
  const cover =
    condition === 'clouds' &&
    cloudCover !== undefined &&
    Number.isFinite(cloudCover)
      ? Math.min(100, Math.max(0, cloudCover)) / 100
      : 0.7;
  // Keep the unfolded panorama. On phones, crop into its more sculpted
  // right-hand side and size the bank to the space above the first card.
  const bankHeight = panoramic
    ? Math.min(width / 3, height * 0.5)
    : Math.min(openingBottom, width * 0.6);
  const bankBottom = bankHeight * (rain ? 0.86 : 0.66 + 0.23 * cover);
  const skyDepth = clouds ? bankBottom : bankHeight;
  const fadeEnd =
    panoramic && !sunny
      ? brightDay && hero
        ? Math.min(skyDepth, openingBottom)
        : skyDepth
      : openingBottom;
  const fieldHeight = brightDay || sunny ? fadeEnd : height;
  const bankFade = Math.min(fadeEnd, bankBottom);
  const areas = readingAreas(width, railInset, opening);
  const heroLeft = railInset + (hero?.frame.x ?? 0);
  const heroWidth = hero?.frame.width ?? width - railInset;
  const lightY = hero
    ? insetTop + hero.frame.y + Math.min(22, hero.frame.height * 0.075)
    : fadeEnd * 0.5;
  const boltClearance = Math.min(33, heroWidth * 0.076);
  const lightning = [
    { x: heroLeft + heroWidth * 0.8, y: lightY },
    { x: heroLeft + heroWidth * 0.93, y: lightY - boltClearance * 1.5 },
  ].find(({ x, y }) => hasRoom(x, y, boltClearance, areas)) ?? {
    x: heroLeft + heroWidth * 0.86,
    y: -boltClearance * 1.1,
  };
  const rayLength = Math.min(width * 1.25, fadeEnd * 3);
  const density = panoramic ? Math.max(1, Math.min(2.5, width / 480)) : 1;
  const cloudOpacity =
    condition === 'clouds'
      ? 0.5 + 0.5 * cover
      : condition === 'snow' || condition === 'drizzle'
        ? 0.65
        : 1;
  const openingMask = (name: string, end: number, softenLeft: boolean) => (
    <>
      <LinearGradient
        id={`${id}-${name}-fade`}
        gradientUnits="userSpaceOnUse"
        x1="0"
        x2="0"
        y1={
          panoramic && !sunny ? Math.min(headerBottom, end * 0.3) : end * 0.53
        }
        y2={end}
      >
        <Stop offset="0" stopColor="white" />
        <Stop offset="1" stopColor="white" stopOpacity={0} />
      </LinearGradient>
      {softenLeft && (
        <LinearGradient
          id={`${id}-${name}-open-sky`}
          gradientUnits="userSpaceOnUse"
          x1={railInset}
          x2={width}
          y1={0}
          y2={0}
        >
          <Stop
            offset="0"
            stopColor="black"
            stopOpacity={panoramic ? 0.96 : 0.9}
          />
          <Stop
            offset="0.22"
            stopColor="black"
            stopOpacity={panoramic ? 0.94 : 0.8}
          />
          <Stop
            offset="0.64"
            stopColor="black"
            stopOpacity={panoramic ? 0.12 : 0.18}
          />
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
        height={end}
      >
        <Rect width={width} height={end} fill={url(`${name}-fade`)} />
        {softenLeft && (
          <Rect width={width} height={end} fill={url(`${name}-open-sky`)} />
        )}
      </Mask>
    </>
  );
  const weatherOpacity = panoramic
    ? brightDay
      ? 0.4
      : 0.3
    : theme.isNight
      ? 0.58
      : 0.82;
  const skyOpacity = sunny ? 0.98 : starry ? 0.8 : weatherOpacity;
  const mistDepth = panoramic ? fieldHeight : openingBottom;
  const starDepth = Math.min(height, Math.max(openingBottom, heroWidth) * 1.5);
  const precipitationCount =
    condition === 'drizzle' ? 16 : condition === 'snow' ? 24 : 32;
  const precipitation =
    rain || condition === 'snow'
      ? openSkyPoints(
          width,
          panoramic ? height : openingBottom * 1.45,
          Math.round(precipitationCount * density),
          areas,
          rain ? 15 : 8,
        )
      : [];
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
          opacity: skyOpacity,
          overflow: 'hidden',
        }}
      >
        {!starry && (
          <Svg width={width} height={fieldHeight} accessible={false}>
            <Defs>
              {clouds &&
                openingMask('cloud-bank', bankFade, !panoramic || brightDay)}
              {(sunny || (condition === 'mist' && (brightDay || !panoramic))) &&
                openingMask(
                  'opening',
                  fadeEnd,
                  !sunny && panoramic && brightDay,
                )}
              {sunny && (
                <RadialGradient id={id + '-sunlight'} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#FFFBE9" stopOpacity={0.37} />
                  <Stop offset="0.38" stopColor="#FFF9E7" stopOpacity={0.26} />
                  <Stop offset="0.72" stopColor="#F7FBFF" stopOpacity={0.08} />
                  <Stop offset="1" stopColor="#F7FBFF" stopOpacity={0} />
                </RadialGradient>
              )}
              {condition === 'mist' && (
                <RadialGradient id={id + '-mist'} cx="50%" cy="50%" r="50%">
                  <Stop offset="0" stopColor="#EFF8FA" stopOpacity={0.65} />
                  <Stop offset="0.4" stopColor="#E3F1F4" stopOpacity={0.46} />
                  <Stop offset="1" stopColor="#D7E9EE" stopOpacity={0} />
                </RadialGradient>
              )}
            </Defs>
            {clouds && (
              <G mask={url('cloud-bank')}>
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
                  preserveAspectRatio={
                    panoramic ? 'xMidYMin slice' : 'xMaxYMin slice'
                  }
                  opacity={cloudOpacity}
                />
                {condition === 'thunderstorm' && (
                  <G
                    transform={`translate(${lightning.x} ${lightning.y - 20})`}
                    fill="none"
                    stroke="#F4EDFF"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  >
                    <Path
                      d="M 5 0 L 0 10 L 2 14 L -9 23 L -8 28 L -20 40"
                      strokeWidth={1.3}
                    />
                    <Path
                      d="M 2 14 L 8 19 L 10 25 M -9 23 L -16 24 L -21 29"
                      strokeWidth={0.75}
                      opacity={0.7}
                    />
                  </G>
                )}
              </G>
            )}
            {sunny && (
              <G mask={url('opening')}>
                <G
                  transform={`translate(${railInset - rayLength * 0.11} ${-rayLength * 0.08})`}
                >
                  {sunlightRays.map(({ angle, spread, opacity }) => (
                    <Ellipse
                      key={angle}
                      cx={rayLength * 0.34}
                      cy={0}
                      rx={rayLength * 0.67}
                      ry={rayLength * spread}
                      transform={`rotate(${angle})`}
                      fill={url('sunlight')}
                      opacity={opacity}
                    />
                  ))}
                </G>
              </G>
            )}
            {condition === 'mist' && (
              <G mask={brightDay || !panoramic ? url('opening') : undefined}>
                <Ellipse
                  cx={width * 0.96}
                  cy={mistDepth * 0.18}
                  rx={width * 0.82}
                  ry={mistDepth * 0.43}
                  fill={url('mist')}
                />
                <Ellipse
                  cx={width * 0.12}
                  cy={mistDepth * 0.53}
                  rx={width * 0.86}
                  ry={mistDepth * 0.28}
                  fill={url('mist')}
                  opacity={0.66}
                />
                <Ellipse
                  cx={width * 0.84}
                  cy={mistDepth * 0.72}
                  rx={width * 0.65}
                  ry={mistDepth * 0.25}
                  fill={url('mist')}
                  opacity={0.7}
                />
              </G>
            )}
          </Svg>
        )}
        {hasParticles && (
          <Animated.View
            testID="weather-particles"
            style={[
              {
                position: 'absolute',
                top: particleTop,
                left: railInset,
                width: Math.max(0, particleRight - railInset),
                overflow: 'hidden',
              },
              particleClip,
            ]}
          >
            <Animated.View
              style={[
                { position: 'absolute', top: -particleTop, left: -railInset },
                starry && starScroll,
              ]}
            >
              <Svg width={width} height={fieldHeight} accessible={false}>
                <Defs>
                  {brightDay &&
                    openingMask('particle-opening', fadeEnd, panoramic)}
                  {rain && (
                    <LinearGradient
                      id={id + '-rain'}
                      x1="0%"
                      y1="0%"
                      x2="0%"
                      y2="100%"
                    >
                      <Stop offset="0" stopColor="white" stopOpacity={0} />
                      <Stop offset="0.5" stopColor="white" stopOpacity={0.64} />
                      <Stop offset="1" stopColor="white" stopOpacity={0.9} />
                    </LinearGradient>
                  )}
                </Defs>
                <G mask={brightDay ? url('particle-opening') : undefined}>
                  {starry &&
                    clearNightStars(width, starDepth, areas).map((star, i) => (
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
                    precipitation.map(({ x, y, seed }) => {
                      const length =
                        (condition === 'drizzle' ? 7 : 15) + (seed % 4) * 2;
                      return (
                        <Rect
                          key={seed}
                          x={x}
                          y={y - length / 2}
                          width={1}
                          height={length}
                          transform={`rotate(13 ${x} ${y})`}
                          fill={url('rain')}
                          opacity={0.42 + (seed % 4) * 0.16}
                        />
                      );
                    })}
                  {condition === 'snow' &&
                    precipitation.map(({ x, y, seed }) => (
                      <Circle
                        key={seed}
                        cx={x}
                        cy={y}
                        r={(2 + (seed % 3)) / 2}
                        opacity={0.4 + (seed % 3) * 0.2}
                        fill="white"
                      />
                    ))}
                </G>
              </Svg>
            </Animated.View>
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
});
