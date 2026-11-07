import { WeatherCondition } from '../types/weather';

export interface WeatherTheme {
  isDark: boolean;
  isNight: boolean;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  heroText: string;
  heroSecondary: string;
  glass: string;
  glassBorder: string;
  divider: string;
  shadow: string;
  onPrimary: string;
  danger: string;
  warning: string;
  success: string;
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  gradient: readonly [string, string, string];
  gradientLocations: readonly [number, number, number];
  colors: { background: string; text: string; primary: string };
  radii: { medium: number };
}

type Palette = readonly [string, string, string];
type Atmosphere = Exclude<WeatherCondition, 'fog'> | 'night';
export const weatherPalettes: Record<
  Atmosphere,
  { light: Palette; dark: Palette }
> = {
  clear: {
    light: ['#064BCC', '#0865DF', '#6BD6FF'],
    dark: ['#06296F', '#084BAA', '#169ADB'],
  },
  clouds: {
    light: ['#345D8F', '#426C9A', '#B8D6EB'],
    dark: ['#162D51', '#2B507B', '#5484AE'],
  },
  drizzle: {
    light: ['#005A73', '#076C81', '#78DAD6'],
    dark: ['#103B50', '#15576F', '#3FA4B3'],
  },
  rain: {
    light: ['#1147A3', '#215FB0', '#79BCEB'],
    dark: ['#102E65', '#214E91', '#3C93CE'],
  },
  snow: {
    light: ['#285C91', '#326BA4', '#D4F1FF'],
    dark: ['#173E66', '#2A5A83', '#73B5D5'],
  },
  mist: {
    light: ['#465F79', '#536D87', '#C7D8E2'],
    dark: ['#263D53', '#3E5870', '#819EAD'],
  },
  thunderstorm: {
    light: ['#203B76', '#3B548F', '#7D9ED3'],
    dark: ['#101D45', '#273769', '#526FA3'],
  },
  night: {
    light: ['#101F64', '#21458F', '#5586CE'],
    dark: ['#071437', '#10275E', '#28579D'],
  },
};

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

/** Appearance is a stored preference; night is supplied by the active location. */
export const getTheme = (
  condition: WeatherCondition,
  isDarkMode = false,
  isNight = false,
): WeatherTheme => {
  const atmosphere =
    condition === 'clear' && isNight
      ? 'night'
      : condition === 'fog'
        ? 'mist'
        : condition;
  const gradient = weatherPalettes[atmosphere][isDarkMode ? 'dark' : 'light'];
  const primary = isDarkMode ? '#FFFFFF' : '#083877';
  const surface = isDarkMode ? '#112C52' : '#E7F3FF';
  const text = isDarkMode ? '#F5FAFF' : '#0A2B52';
  const danger = isDarkMode ? '#FFB4B4' : '#9B1C31';
  return {
    isDark: isDarkMode,
    isNight,
    primary,
    secondary: primary,
    background: surface,
    surface,
    text,
    textSecondary: isDarkMode ? '#D8E9FC' : '#1C3C61',
    accent: danger,
    danger,
    warning: isDarkMode ? '#FFD166' : '#805000',
    success: isDarkMode ? '#8CE3B1' : '#17603D',
    heroText: '#FFFFFF',
    heroSecondary: '#F0F6FF',
    glass: isDarkMode ? 'rgba(7, 27, 59, 0.56)' : 'rgba(255, 255, 255, 0.56)',
    glassBorder: isDarkMode
      ? 'rgba(200, 231, 255, 0.28)'
      : 'rgba(255, 255, 255, 0.70)',
    divider: isDarkMode
      ? 'rgba(225, 241, 255, 0.22)'
      : 'rgba(9, 55, 109, 0.15)',
    shadow: 'rgba(0, 29, 89, 0.12)',
    onPrimary: isDarkMode ? '#112C52' : '#FFFFFF',
    gradientStart: gradient[0],
    gradientMiddle: gradient[1],
    gradientEnd: gradient[2],
    gradient,
    gradientLocations: [0, 0.58, 1],
    colors: { background: surface, text, primary },
    radii: { medium: 18 },
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
