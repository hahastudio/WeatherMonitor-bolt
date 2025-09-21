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
  colors: {
    background: string;
    text: string;
    primary: string;
  };
  radii: {
    medium: number;
  };
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
  if (main.includes('thunderstorm') || main.includes('storm'))
    return 'thunderstorm';
  if (main.includes('drizzle')) return 'drizzle';
  if (main.includes('mist') || main.includes('fog') || main.includes('haze'))
    return 'mist';

  return 'clear';
};

export const defaultTheme: WeatherTheme = {
  primary: '#4A90E2',
  secondary: '#4A90E2',
  background: '#F0F4F8',
  surface: '#FFFFFF',
  text: '#333333',
  textSecondary: '#667788',
  accent: '#FF6B6B',
  gradientStart: '#F8FAFC',
  gradientEnd: '#E0E8F0',
  colors: {
    background: '#F0F4F8',
    text: '#333333',
    primary: '#4A90E2',
  },
  radii: {
    medium: 8,
  },
};

export const getTheme = (
  condition: WeatherCondition,
  isDarkMode: boolean = false,
): WeatherTheme => {
  const isNight = isNightTime();
  const useDarkTheme = isDarkMode || isNight;

  const themes: Record<
    WeatherCondition,
    { light: WeatherTheme; dark: WeatherTheme }
  > = {
    clear: {
      light: {
        primary: '#FF8C00', // Darker orange for better contrast
        secondary: '#FF6347', // Tomato red
        background: '#87CEEB', // Sky blue
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black for maximum contrast
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#DC143C', // Crimson red
        gradientStart: '#87CEEB',
        gradientEnd: '#B0E0E6', // Powder blue
        colors: {
          background: '#87CEEB',
          text: '#1A1A1A',
          primary: '#FF8C00',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#FFD700', // Bright gold
        secondary: '#FFA500', // Orange
        background: '#0F1419', // Very dark blue
        surface: '#1E2A3A', // Dark blue-gray
        text: '#FFFFFF', // Pure white
        textSecondary: '#B8C5D1', // Light blue-gray
        accent: '#FF6B6B', // Coral red
        gradientStart: '#0F1419',
        gradientEnd: '#1E2A3A',
        colors: {
          background: '#0F1419',
          text: '#FFFFFF',
          primary: '#FFD700',
        },
        radii: {
          medium: 8,
        },
      },
    },
    clouds: {
      light: {
        primary: '#4169E1', // Royal blue
        secondary: '#6495ED', // Cornflower blue
        background: '#F5F5F5', // White smoke
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#FF4500', // Orange red
        gradientStart: '#F5F5F5',
        gradientEnd: '#E6E6FA', // Lavender
        colors: {
          background: '#F5F5F5',
          text: '#1A1A1A',
          primary: '#4169E1',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#87CEEB', // Sky blue
        secondary: '#4682B4', // Steel blue
        background: '#2C2C2C', // Dark gray
        surface: '#3A3A3A', // Medium gray
        text: '#FFFFFF', // Pure white
        textSecondary: '#CCCCCC', // Light gray
        accent: '#FFD700', // Gold
        gradientStart: '#2C2C2C',
        gradientEnd: '#3A3A3A',
        colors: {
          background: '#2C2C2C',
          text: '#FFFFFF',
          primary: '#87CEEB',
        },
        radii: {
          medium: 8,
        },
      },
    },
    rain: {
      light: {
        primary: '#1E90FF', // Dodger blue
        secondary: '#00BFFF', // Deep sky blue
        background: '#F0F8FF', // Alice blue
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#FF1493', // Deep pink
        gradientStart: '#F0F8FF',
        gradientEnd: '#E0F6FF', // Light cyan
        colors: {
          background: '#F0F8FF',
          text: '#1A1A1A',
          primary: '#1E90FF',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#00BFFF', // Deep sky blue
        secondary: '#1E90FF', // Dodger blue
        background: '#0D1B2A', // Very dark blue
        surface: '#1B263B', // Dark blue
        text: '#FFFFFF', // Pure white
        textSecondary: '#B8D4F0', // Light blue
        accent: '#FF6B6B', // Coral
        gradientStart: '#0D1B2A',
        gradientEnd: '#1B263B',
        colors: {
          background: '#0D1B2A',
          text: '#FFFFFF',
          primary: '#00BFFF',
        },
        radii: {
          medium: 8,
        },
      },
    },
    snow: {
      light: {
        primary: '#4169E1', // Royal blue
        secondary: '#6495ED', // Cornflower blue
        background: '#F8F8FF', // Ghost white
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#DC143C', // Crimson
        gradientStart: '#F8F8FF',
        gradientEnd: '#F0F8FF', // Alice blue
        colors: {
          background: '#F8F8FF',
          text: '#1A1A1A',
          primary: '#4169E1',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#87CEEB', // Sky blue
        secondary: '#B0E0E6', // Powder blue
        background: '#1C2541', // Dark blue
        surface: '#2A3A5A', // Medium blue
        text: '#FFFFFF', // Pure white
        textSecondary: '#D0E0F0', // Very light blue
        accent: '#FFD700', // Gold
        gradientStart: '#1C2541',
        gradientEnd: '#2A3A5A',
        colors: {
          background: '#1C2541',
          text: '#FFFFFF',
          primary: '#87CEEB',
        },
        radii: {
          medium: 8,
        },
      },
    },
    thunderstorm: {
      light: {
        primary: '#8B008B', // Dark magenta
        secondary: '#9932CC', // Dark orchid
        background: '#E6E6FA', // Lavender
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#FFD700', // Gold
        gradientStart: '#E6E6FA',
        gradientEnd: '#DDA0DD', // Plum
        colors: {
          background: '#E6E6FA',
          text: '#1A1A1A',
          primary: '#8B008B',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#9370DB', // Medium orchid
        secondary: '#8A2BE2', // Blue violet
        background: '#1A0B2E', // Very dark purple
        surface: '#2D1B3D', // Dark purple
        text: '#FFFFFF', // Pure white
        textSecondary: '#E0D0F0', // Light purple
        accent: '#FFD700', // Gold
        gradientStart: '#1A0B2E',
        gradientEnd: '#2D1B3D',
        colors: {
          background: '#1A0B2E',
          text: '#FFFFFF',
          primary: '#9370DB',
        },
        radii: {
          medium: 8,
        },
      },
    },
    drizzle: {
      light: {
        primary: '#20B2AA', // Light sea green
        secondary: '#48D1CC', // Medium turquoise
        background: '#F0FFFF', // Azure
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#FF4500', // Orange red
        gradientStart: '#F0FFFF',
        gradientEnd: '#E0FFFF', // Light cyan
        colors: {
          background: '#F0FFFF',
          text: '#1A1A1A',
          primary: '#20B2AA',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#40E0D0', // Turquoise
        secondary: '#20B2AA', // Light sea green
        background: '#0F2027', // Very dark teal
        surface: '#1E3A3A', // Dark teal
        text: '#FFFFFF', // Pure white
        textSecondary: '#B0E0E6', // Powder blue
        accent: '#FF6B6B', // Coral
        gradientStart: '#0F2027',
        gradientEnd: '#1E3A3A',
        colors: {
          background: '#0F2027',
          text: '#FFFFFF',
          primary: '#40E0D0',
        },
        radii: {
          medium: 8,
        },
      },
    },
    mist: {
      light: {
        primary: '#696969', // Dim gray
        secondary: '#808080', // Gray
        background: '#F5F5F5', // White smoke
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#FF6347', // Tomato
        gradientStart: '#F5F5F5',
        gradientEnd: '#DCDCDC', // Gainsboro
        colors: {
          background: '#F5F5F5',
          text: '#1A1A1A',
          primary: '#696969',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#A9A9A9', // Dark gray
        secondary: '#C0C0C0', // Silver
        background: '#2F2F2F', // Dark gray
        surface: '#3A3A3A', // Medium gray
        text: '#FFFFFF', // Pure white
        textSecondary: '#CCCCCC', // Light gray
        accent: '#FF6B6B', // Coral
        gradientStart: '#2F2F2F',
        gradientEnd: '#3A3A3A',
        colors: {
          background: '#2F2F2F',
          text: '#FFFFFF',
          primary: '#A9A9A9',
        },
        radii: {
          medium: 8,
        },
      },
    },
    fog: {
      light: {
        primary: '#696969', // Dim gray
        secondary: '#808080', // Gray
        background: '#F5F5F5', // White smoke
        surface: '#FFFFFF', // Pure white
        text: '#1A1A1A', // Almost black
        textSecondary: '#4A4A4A', // Dark gray
        accent: '#FF6347', // Tomato
        gradientStart: '#F5F5F5',
        gradientEnd: '#DCDCDC', // Gainsboro
        colors: {
          background: '#F5F5F5',
          text: '#1A1A1A',
          primary: '#696969',
        },
        radii: {
          medium: 8,
        },
      },
      dark: {
        primary: '#A9A9A9', // Dark gray
        secondary: '#C0C0C0', // Silver
        background: '#2F2F2F', // Dark gray
        surface: '#3A3A3A', // Medium gray
        text: '#FFFFFF', // Pure white
        textSecondary: '#CCCCCC', // Light gray
        accent: '#FF6B6B', // Coral
        gradientStart: '#2F2F2F',
        gradientEnd: '#3A3A3A',
        colors: {
          background: '#2F2F2F',
          text: '#FFFFFF',
          primary: '#A9A9A9',
        },
        radii: {
          medium: 8,
        },
      },
    },
  };

  return useDarkTheme ? themes[condition].dark : themes[condition].light;
};

export const formatTemperature = (temp: number): string => {
  return `${Math.round(temp)}°C`;
};

export const formatTime = (timestamp: number): string => {
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
