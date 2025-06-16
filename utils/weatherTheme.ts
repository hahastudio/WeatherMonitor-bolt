import { WeatherCondition } from '../types/weather';

export interface WeatherTheme {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  gradientStart: string;
  gradientEnd: string;
}

const isNightTime = (): boolean => {
  const hour = new Date().getHours();
  return hour < 6 || hour > 18;
};

export const getWeatherCondition = (weatherMain: string): WeatherCondition => {
  const main = weatherMain.toLowerCase();
  
  if (main.includes('clear')) return 'clear';
  if (main.includes('cloud')) return 'clouds';
  if (main.includes('rain')) return 'rain';
  if (main.includes('snow')) return 'snow';
  if (main.includes('thunderstorm') || main.includes('storm')) return 'thunderstorm';
  if (main.includes('drizzle')) return 'drizzle';
  if (main.includes('mist') || main.includes('fog') || main.includes('haze')) return 'mist';
  
  return 'clear';
};

export const getWeatherTheme = (condition: WeatherCondition, isDarkMode: boolean = false): WeatherTheme => {
  const isNight = isNightTime();
  const useDarkTheme = isDarkMode || isNight;

  const themes: Record<WeatherCondition, { light: WeatherTheme; dark: WeatherTheme }> = {
    clear: {
      light: {
        primary: '#FFD700',
        secondary: '#FFA500',
        background: '#87CEEB',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#FF6B6B',
        gradientStart: '#87CEEB',
        gradientEnd: '#98D8E8',
      },
      dark: {
        primary: '#4A90E2',
        secondary: '#357ABD',
        background: '#1A1A2E',
        surface: '#16213E',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#FFD700',
        gradientStart: '#1A1A2E',
        gradientEnd: '#16213E',
      },
    },
    clouds: {
      light: {
        primary: '#708090',
        secondary: '#778899',
        background: '#D3D3D3',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#4682B4',
        gradientStart: '#D3D3D3',
        gradientEnd: '#E6E6FA',
      },
      dark: {
        primary: '#4F4F4F',
        secondary: '#696969',
        background: '#2F2F2F',
        surface: '#3A3A3A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#87CEEB',
        gradientStart: '#2F2F2F',
        gradientEnd: '#3A3A3A',
      },
    },
    rain: {
      light: {
        primary: '#4682B4',
        secondary: '#5F9EA0',
        background: '#B0C4DE',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#FF6B6B',
        gradientStart: '#B0C4DE',
        gradientEnd: '#D8E4F0',
      },
      dark: {
        primary: '#2E4057',
        secondary: '#3E5670',
        background: '#1E2A3A',
        surface: '#2A3A4A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#4682B4',
        gradientStart: '#1E2A3A',
        gradientEnd: '#2A3A4A',
      },
    },
    snow: {
      light: {
        primary: '#F0F8FF',
        secondary: '#E6F3FF',
        background: '#F5F5F5',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#4169E1',
        gradientStart: '#F5F5F5',
        gradientEnd: '#FFFFFF',
      },
      dark: {
        primary: '#E6F3FF',
        secondary: '#CCE7FF',
        background: '#1C2541',
        surface: '#2A3A5A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#87CEEB',
        gradientStart: '#1C2541',
        gradientEnd: '#2A3A5A',
      },
    },
    thunderstorm: {
      light: {
        primary: '#483D8B',
        secondary: '#6A5ACD',
        background: '#696969',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#FFD700',
        gradientStart: '#696969',
        gradientEnd: '#808080',
      },
      dark: {
        primary: '#2E1A47',
        secondary: '#4A2C6A',
        background: '#1A0B2E',
        surface: '#2D1B3D',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#FFD700',
        gradientStart: '#1A0B2E',
        gradientEnd: '#2D1B3D',
      },
    },
    drizzle: {
      light: {
        primary: '#4682B4',
        secondary: '#5F9EA0',
        background: '#B0C4DE',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#20B2AA',
        gradientStart: '#B0C4DE',
        gradientEnd: '#D8E4F0',
      },
      dark: {
        primary: '#2E4057',
        secondary: '#3E5670',
        background: '#1E2A3A',
        surface: '#2A3A4A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#20B2AA',
        gradientStart: '#1E2A3A',
        gradientEnd: '#2A3A4A',
      },
    },
    mist: {
      light: {
        primary: '#708090',
        secondary: '#778899',
        background: '#D3D3D3',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#B0C4DE',
        gradientStart: '#D3D3D3',
        gradientEnd: '#E0E0E0',
      },
      dark: {
        primary: '#4F4F4F',
        secondary: '#696969',
        background: '#2F2F2F',
        surface: '#3A3A3A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#B0C4DE',
        gradientStart: '#2F2F2F',
        gradientEnd: '#3A3A3A',
      },
    },
    fog: {
      light: {
        primary: '#708090',
        secondary: '#778899',
        background: '#D3D3D3',
        surface: '#FFFFFF',
        text: '#333333',
        textSecondary: '#666666',
        accent: '#B0C4DE',
        gradientStart: '#D3D3D3',
        gradientEnd: '#E0E0E0',
      },
      dark: {
        primary: '#4F4F4F',
        secondary: '#696969',
        background: '#2F2F2F',
        surface: '#3A3A3A',
        text: '#FFFFFF',
        textSecondary: '#B0B0B0',
        accent: '#B0C4DE',
        gradientStart: '#2F2F2F',
        gradientEnd: '#3A3A3A',
      },
    },
  };

  return useDarkTheme ? themes[condition].dark : themes[condition].light;
};

export const formatTemperature = (temp: number): string => {
  return `${Math.round(temp)}°C`;
};

export const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
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