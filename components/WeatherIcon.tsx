import React from 'react';
import { View, StyleSheet } from 'react-native';
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Zap, 
  CloudDrizzle,
  Cloudy,
  Moon,
  CloudLightning,
} from 'lucide-react-native';

interface WeatherIconProps {
  weatherMain: string;
  size?: number;
  color?: string;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({ 
  weatherMain, 
  size = 48, 
  color = '#333333' 
}) => {
  const getWeatherIcon = () => {
    const main = weatherMain.toLowerCase();
    
    if (main.includes('clear')) {
      const hour = new Date().getHours();
      const isNight = hour < 6 || hour > 18;
      return isNight ? <Moon size={size} color={color} /> : <Sun size={size} color={color} />;
    }
    if (main.includes('cloud')) return <Cloud size={size} color={color} />;
    if (main.includes('rain')) return <CloudRain size={size} color={color} />;
    if (main.includes('snow')) return <CloudSnow size={size} color={color} />;
    if (main.includes('thunderstorm') || main.includes('storm')) {
      return <CloudLightning size={size} color={color} />;
    }
    if (main.includes('drizzle')) return <CloudDrizzle size={size} color={color} />;
    if (main.includes('mist') || main.includes('fog') || main.includes('haze')) {
      return <Cloudy size={size} color={color} />;
    }
    
    return <Sun size={size} color={color} />;
  };

  return (
    <View style={styles.container}>
      {getWeatherIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});