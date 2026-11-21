import type { WeatherCondition } from '../types/weather';

export type SceneCondition = Exclude<WeatherCondition, 'fog'>;
type Palette = readonly [string, string, string];
export interface WeatherMaterial {
  tint: string;
  opacity: number;
  backdropBrightness?: number;
}

export interface WeatherTheme {
  condition: SceneCondition;
  isDark: boolean;
  isNight: boolean;
  brightDay: boolean;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  heroText: string;
  heroSecondary: string;
  content: WeatherMaterial;
  daylightGlass?: Palette;
  navigation: WeatherMaterial;
  selection: string;
  glassBorder: string;
  divider: string;
  onPrimary: string;
  danger: string;
  warning: string;
  success: string;
  sceneTop: string;
  gradient: Palette;
  gradientLocations: readonly [number, number, number];
}

interface WeatherPalette {
  day: Palette;
  night: Palette;
  glassTint: string;
  daylightOpacity: readonly [number, number, number];
  nightOpacity: number;
  ink: string;
  navigationBrightness: number;
  opaqueDay: string;
}

// The palest stop in each sky sets the tint needed for small white captions.
export const weatherPalettes: Record<SceneCondition, WeatherPalette> = {
  clear: {
    day: ['#149EEE', '#42B8F2', '#9DE4F6'],
    night: ['#07172E', '#102E50', '#264D6A'],
    glassTint: '#001B55',
    daylightOpacity: [0.38, 0.47, 0.57],
    nightOpacity: 0.26,
    ink: '#0B426D',
    navigationBrightness: 0.515,
    opaqueDay: '#35779B',
  },
  clouds: {
    day: ['#1468C7', '#359DE0', '#8ADAF1'],
    night: ['#102A43', '#294C68', '#577B94'],
    glassTint: '#001C4C',
    daylightOpacity: [0.21, 0.37, 0.55],
    nightOpacity: 0.28,
    ink: '#164565',
    navigationBrightness: 0.535,
    opaqueDay: '#357897',
  },
  drizzle: {
    day: ['#287687', '#5A9CAA', '#A0CDD1'],
    night: ['#102E3B', '#254C5A', '#547C86'],
    glassTint: '#021F2D',
    daylightOpacity: [0.21, 0.34, 0.53],
    nightOpacity: 0.28,
    ink: '#154651',
    navigationBrightness: 0.57,
    opaqueDay: '#487880',
  },
  rain: {
    day: ['#275E88', '#4B88A9', '#8EB8CA'],
    night: ['#11283D', '#23455D', '#486B80'],
    glassTint: '#031E3D',
    daylightOpacity: [0.18, 0.26, 0.47],
    nightOpacity: 0.26,
    ink: '#123B55',
    navigationBrightness: 0.635,
    opaqueDay: '#457790',
  },
  snow: {
    day: ['#467EAB', '#82B7D6', '#C9E3EF'],
    night: ['#18324B', '#355970', '#7394A6'],
    glassTint: '#102239',
    daylightOpacity: [0.3, 0.49, 0.61],
    nightOpacity: 0.5,
    ink: '#244961',
    navigationBrightness: 0.46,
    opaqueDay: '#557488',
  },
  mist: {
    day: ['#527F99', '#7CA4B6', '#BDD4DD'],
    night: ['#233B4C', '#466373', '#78929D'],
    glassTint: '#10222D',
    daylightOpacity: [0.26, 0.42, 0.57],
    nightOpacity: 0.5,
    ink: '#2A4B5B',
    navigationBrightness: 0.52,
    opaqueDay: '#597581',
  },
  thunderstorm: {
    day: ['#263C63', '#4C698A', '#829EB5'],
    night: ['#101E34', '#263952', '#4A5F76'],
    glassTint: '#0C1A38',
    daylightOpacity: [0.18, 0.21, 0.36],
    nightOpacity: 0.26,
    ink: '#172F4C',
    navigationBrightness: 0.755,
    opaqueDay: '#527490',
  },
};

const channels = (hex: string) =>
  [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));

const dimChannels = channels('#051221');
export const sceneDim = 'rgba(5, 18, 33, 0.16)';
export const heroLetterShadow = {
  textShadowColor: 'rgba(8, 55, 91, 0.18)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
} as const;

function dimColor(hex: string, fraction: number) {
  const mixed = channels(hex).map((channel, i) =>
    Math.round(channel * (1 - fraction) + dimChannels[i] * fraction),
  );
  return (
    '#' +
    mixed
      .map((c) => c.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  );
}

/** Match a*tint + (1-a)*brightness*sky with a single RGBA fill over the blur. */
export function materialFill(
  { tint, opacity, backdropBrightness = 1 }: WeatherMaterial,
  blurTransmission = 1,
) {
  const alpha = 1 - ((1 - opacity) * backdropBrightness) / blurTransmission;
  const rgb = channels(tint).map((channel) =>
    Math.round((channel * opacity) / alpha),
  );
  return `rgba(${rgb.join(', ')}, ${Number(alpha.toFixed(6))})`;
}

export const getWeatherCondition = (weatherMain: string): WeatherCondition => {
  const main = weatherMain.toLowerCase();
  if (main.includes('thunderstorm') || main.includes('storm'))
    return 'thunderstorm';
  if (main.includes('drizzle')) return 'drizzle';
  if (main.includes('cloud')) return 'clouds';
  if (main.includes('rain')) return 'rain';
  if (main.includes('snow')) return 'snow';
  if (main.includes('mist') || main.includes('fog') || main.includes('haze'))
    return 'mist';
  return 'clear';
};

/** Daylight is resolved for the active location independently of the stored appearance. */
export const getTheme = (
  weather: WeatherCondition,
  isDarkMode = false,
  isNight = false,
): WeatherTheme => {
  const condition = weather === 'fog' ? 'mist' : weather;
  const scene = weatherPalettes[condition];
  const gradient = isNight ? scene.night : scene.day;
  const brightDay = !isNight && !isDarkMode;
  const ink = isDarkMode ? dimColor(scene.ink, 0.3) : scene.ink;
  const textSecondary = brightDay ? '#F5FBFF' : '#E7F3FC';
  const adjustment = isDarkMode ? 0.05 : 0;
  const [top, middle, horizon] = scene.daylightOpacity;
  const glassColor = (opacity: number) =>
    materialFill({ tint: scene.glassTint, opacity: opacity - adjustment });
  return {
    condition,
    isDark: isDarkMode,
    isNight,
    brightDay,
    gradient,
    gradientLocations: [0, 0.58, 1],
    sceneTop: isDarkMode ? dimColor(gradient[0], 0.16) : gradient[0],
    content: {
      tint: isNight ? ink : scene.glassTint,
      opacity: (isNight ? scene.nightOpacity : horizon) - adjustment,
    },
    daylightGlass: isNight
      ? undefined
      : [glassColor(top), glassColor(middle), glassColor(horizon)],
    navigation: {
      tint: brightDay ? '#0865A6' : ink,
      opacity: brightDay ? 0.5 : 0.9,
      backdropBrightness: brightDay ? scene.navigationBrightness : 1,
    },
    surface: brightDay ? scene.opaqueDay : ink,
    background: ink,
    glassBorder: 'rgba(255, 255, 255, 0.06)',
    divider: 'rgba(231, 243, 252, 0.18)',
    selection: brightDay
      ? 'rgba(3, 64, 108, 0.2)'
      : 'rgba(255, 255, 255, 0.14)',
    primary: '#FFFFFF',
    secondary: textSecondary,
    text: '#FFFFFF',
    textSecondary,
    heroText: '#FFFFFF',
    heroSecondary: textSecondary,
    onPrimary: '#10283D',
    accent: '#FFB4B4',
    danger: '#FFB4B4',
    warning: '#FFD166',
    success: '#8CE3B1',
  };
};

export const defaultTheme = getTheme('clear');

export const formatTemperature = (temp: number): string => {
  return `${Math.round(temp)}°C`;
};

export const formatTime = (timestamp?: number): string => {
  if (!timestamp || !Number.isFinite(timestamp)) return 'Unavailable';
  const time = new Date(timestamp * 1000);
  if (time.getHours() === 0 && time.getMinutes() === 0)
    return time.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  return time.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const capitalizeWords = (str: string): string => {
  return str.replace(/\b\w/g, (l) => l.toUpperCase());
};
