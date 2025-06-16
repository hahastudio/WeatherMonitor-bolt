import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Moon, 
  Sun, 
  MapPin, 
  Bell, 
  RefreshCw, 
  Info,
  ChevronRight,
  Thermometer,
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { notificationService } from '../../services/notificationService';

export default function SettingsScreen() {
  const { 
    theme, 
    isDarkMode, 
    toggleDarkMode, 
    currentWeather,
    cityName,
    refreshWeather,
  } = useWeather();

  const handleNotificationTest = async () => {
    try {
      await notificationService.showGeneralNotification(
        'Weather App Test',
        'Notifications are working correctly!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send test notification');
    }
  };

  const handleLocationRefresh = async () => {
    Alert.alert(
      'Refresh Location',
      'This will get your current location and update the weather data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Refresh', onPress: refreshWeather },
      ]
    );
  };

  const showAbout = () => {
    Alert.alert(
      'About Weather App',
      'A beautiful weather app built with React Native and Expo. Weather data provided by OpenWeatherMap.\n\nVersion 1.0.0',
      [{ text: 'OK' }]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
      paddingTop: 60,
    },
    header: {
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    title: {
      color: theme.text,
      fontSize: 28,
      fontWeight: '700',
      textAlign: 'center',
    },
    content: {
      paddingHorizontal: 20,
      paddingBottom: 100,
    },
    section: {
      marginBottom: 32,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 16,
    },
    settingItem: {
      backgroundColor: theme.surface + '90',
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingIcon: {
      marginRight: 12,
    },
    settingInfo: {
      flex: 1,
    },
    settingTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
    },
    settingDescription: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 2,
    },
    infoCard: {
      backgroundColor: theme.surface + '90',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    infoTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    infoText: {
      color: theme.textSecondary,
      fontSize: 14,
      lineHeight: 20,
    },
    currentWeatherInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    weatherTemp: {
      color: theme.primary,
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.gradientStart, theme.gradientEnd]}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <ScrollView style={styles.content}>
          {/* Current Weather Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Status</Text>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Location</Text>
              <Text style={styles.infoText}>{cityName}</Text>
              {currentWeather && (
                <View style={styles.currentWeatherInfo}>
                  <Thermometer size={16} color={theme.primary} />
                  <Text style={styles.weatherTemp}>
                    {Math.round(currentWeather.main.temp)}°C
                  </Text>
                  <Text style={[styles.infoText, { marginLeft: 8 }]}>
                    {currentWeather.weather[0].description}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Appearance Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Appearance</Text>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  {isDarkMode ? (
                    <Moon size={24} color={theme.primary} />
                  ) : (
                    <Sun size={24} color={theme.primary} />
                  )}
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Dark Mode</Text>
                  <Text style={styles.settingDescription}>
                    Toggle between light and dark themes
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={toggleDarkMode}
                trackColor={{ false: theme.textSecondary + '40', true: theme.primary + '40' }}
                thumbColor={isDarkMode ? theme.primary : theme.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Location Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={handleLocationRefresh}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <MapPin size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Refresh Location</Text>
                  <Text style={styles.settingDescription}>
                    Update your current location
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={handleNotificationTest}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Bell size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Test Notifications</Text>
                  <Text style={styles.settingDescription}>
                    Send a test notification
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Data Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={refreshWeather}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <RefreshCw size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Refresh Weather</Text>
                  <Text style={styles.settingDescription}>
                    Manually update weather data
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={showAbout}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Info size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>About Weather App</Text>
                  <Text style={styles.settingDescription}>
                    Version information and credits
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* API Key Info */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Setup Required</Text>
            <Text style={styles.infoText}>
              To use this app, you need to add your OpenWeatherMap API key to the .env file. 
              Get your free API key at openweathermap.org and replace the placeholder in the .env file.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}