import { Tabs } from 'expo-router';
import { Chrome as Home, Calendar, Settings, ChartBar as BarChart3, Map } from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';

export default function TabLayout() {
  const { theme } = useWeather();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.primary + '20',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Weather',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="forecast"
        options={{
          title: 'Forecast',
          tabBarIcon: ({ size, color }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Charts',
          tabBarIcon: ({ size, color }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ size, color }) => (
            <Map size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}