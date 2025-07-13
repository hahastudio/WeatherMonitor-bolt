import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import * as Application from 'expo-application';
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
  Clock,
  X,
  Check,
  Activity,
  Shield,
  Database,
} from 'lucide-react-native';
import { useWeather } from '../../contexts/WeatherContext';
import { notificationService } from '../../services/notificationService';
import { alertTracker } from '../../services/alertTracker';
import { ApiLogViewer } from '../../components/ApiLogViewer';

const REFRESH_RATE_OPTIONS = [
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
];

export default function SettingsScreen() {
  const { 
    theme, 
    isDarkMode, 
    toggleDarkMode, 
    currentWeather,
    cityName,
    refreshWeather,
    refreshRate,
    setRefreshRate,
    lastUpdated,
  } = useWeather();

  const [showRefreshRateModal, setShowRefreshRateModal] = useState(false);
  const [showApiLogModal, setShowApiLogModal] = useState(false);
  const [alertTrackerStats, setAlertTrackerStats] = useState<{
    totalTrackedAlerts: number;
    oldestAlertAge: number | null;
    newestAlertAge: number | null;
  } | null>(null);

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

  const handleRefreshRateChange = async (newRate: number) => {
    await setRefreshRate(newRate);
    setShowRefreshRateModal(false);
  };

  const handleClearAlertHistory = async () => {
    Alert.alert(
      'Clear Alert History',
      'This will clear the history of recent weather alerts and allow duplicate notifications to be sent again. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await alertTracker.clearRecentAlerts();
              setAlertTrackerStats({
                totalTrackedAlerts: 0,
                oldestAlertAge: null,
                newestAlertAge: null,
              });
              Alert.alert('Success', 'Alert history cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear alert history');
            }
          },
        },
      ]
    );
  };

  const loadAlertTrackerStats = async () => {
    try {
      const stats = await alertTracker.getTrackerStats();
      setAlertTrackerStats(stats);
    } catch (error) {
      console.error('Failed to load alert tracker stats:', error);
    }
  };

  const showAbout = () => {
    const version = Application.nativeApplicationVersion || '1.0.0';

    Alert.alert(
      'About Weather App',
      `A beautiful weather app built with React Native and Expo. Weather data provided by OpenWeatherMap.\n\nVersion ${version}`,
      [{ text: 'OK' }]
    );
  };

  const getRefreshRateLabel = (rate: number): string => {
    const option = REFRESH_RATE_OPTIONS.find(opt => opt.value === rate);
    return option ? option.label : `${rate} minutes`;
  };

  const formatLastUpdated = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    
    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else {
      return new Date(timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
  };

  const formatAlertAge = (ageMs: number | null): string => {
    if (!ageMs) return 'N/A';
    
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  };

  // Load alert tracker stats when component mounts
  React.useEffect(() => {
    loadAlertTrackerStats();
  }, []);

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
    settingValue: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
      marginRight: 8,
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
    lastUpdatedInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    lastUpdatedText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginLeft: 8,
    },
    alertStatsContainer: {
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '20',
    },
    alertStatRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    alertStatLabel: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    alertStatValue: {
      color: theme.text,
      fontSize: 12,
      fontWeight: '600',
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderRadius: 16,
      padding: 20,
      width: '80%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      padding: 4,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    optionItemActive: {
      backgroundColor: theme.primary + '20',
    },
    optionText: {
      color: theme.text,
      fontSize: 16,
    },
    optionTextActive: {
      color: theme.primary,
      fontWeight: '600',
    },
    // API Log Modal styles
    apiLogModal: {
      flex: 1,
      backgroundColor: theme.background,
      marginTop: 0, // Remove top margin to eliminate white padding
    },
    apiLogModalHeader: {
      position: 'absolute',
      top: 16,
      right: 20,
      zIndex: 1000,
      backgroundColor: theme.surface,
      borderRadius: 20,
      padding: 8,
    },
  });

  const RefreshRateModal = () => (
    <Modal
      visible={showRefreshRateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowRefreshRateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Auto Refresh Rate</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowRefreshRateModal(false)}
            >
              <X size={24} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {REFRESH_RATE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionItem,
                refreshRate === option.value && styles.optionItemActive,
              ]}
              onPress={() => handleRefreshRateChange(option.value)}
            >
              <Text
                style={[
                  styles.optionText,
                  refreshRate === option.value && styles.optionTextActive,
                ]}
              >
                {option.label}
              </Text>
              {refreshRate === option.value && (
                <Check size={20} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  const ApiLogModal = () => (
    <Modal
      visible={showApiLogModal}
      animationType="slide"
      onRequestClose={() => setShowApiLogModal(false)}
    >
      <View style={styles.apiLogModal}>
        <ApiLogViewer />
        <TouchableOpacity
          style={styles.apiLogModalHeader}
          onPress={() => setShowApiLogModal(false)}
        >
          <X size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    </Modal>
  );

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
              <View style={styles.lastUpdatedInfo}>
                <Clock size={16} color={theme.textSecondary} />
                <Text style={styles.lastUpdatedText}>
                  Last updated {formatLastUpdated(lastUpdated)}
                </Text>
              </View>
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

          {/* Data Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={() => setShowRefreshRateModal(true)}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Clock size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Auto Refresh Rate</Text>
                  <Text style={styles.settingDescription}>
                    How often to update weather data automatically
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.settingValue}>
                  {getRefreshRateLabel(refreshRate)}
                </Text>
                <ChevronRight size={20} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem} onPress={refreshWeather}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <RefreshCw size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Refresh Weather</Text>
                  <Text style={styles.settingDescription}>
                    Manually update weather data now
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={() => setShowApiLogModal(true)}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Activity size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>API Request Log</Text>
                  <Text style={styles.settingDescription}>
                    View API usage and request history (48h)
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
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

          {/* Alert Management */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Alert Management</Text>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Alert Duplicate Prevention</Text>
              <Text style={styles.infoText}>
                The app tracks recent weather alerts to prevent duplicate notifications. 
                Up to 100 recent alert IDs are stored locally.
              </Text>
              
              {alertTrackerStats && (
                <View style={styles.alertStatsContainer}>
                  <View style={styles.alertStatRow}>
                    <Text style={styles.alertStatLabel}>Tracked Alerts:</Text>
                    <Text style={styles.alertStatValue}>{alertTrackerStats.totalTrackedAlerts}</Text>
                  </View>
                  <View style={styles.alertStatRow}>
                    <Text style={styles.alertStatLabel}>Last Updated:</Text>
                    <Text style={styles.alertStatValue}>
                      {formatAlertAge(alertTrackerStats.newestAlertAge)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.settingItem} onPress={handleClearAlertHistory}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Shield size={24} color={theme.accent} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Clear Alert History</Text>
                  <Text style={styles.settingDescription}>
                    Reset duplicate alert prevention
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem} onPress={loadAlertTrackerStats}>
              <View style={styles.settingLeft}>
                <View style={styles.settingIcon}>
                  <Database size={24} color={theme.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Refresh Alert Stats</Text>
                  <Text style={styles.settingDescription}>
                    Update alert tracking statistics
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
        </ScrollView>

        <RefreshRateModal />
        <ApiLogModal />
      </LinearGradient>
    </View>
  );
}