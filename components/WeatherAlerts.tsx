import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { TriangleAlert as AlertTriangle, X, Clock, MapPin } from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { CaiyunWeatherAlert } from '../types/weather';

interface WeatherAlertsProps {
  alerts: CaiyunWeatherAlert[];
  onDismiss?: (alertId: string) => void;
}

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ alerts, onDismiss }) => {
  const { theme } = useWeather();

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const getAlertColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'red':
      case 'severe':
        return '#FF4444';
      case 'orange':
      case 'warning':
        return '#FF8800';
      case 'yellow':
      case 'watch':
        return '#FFD700';
      case 'blue':
      case 'advisory':
        return '#4A90E2';
      default:
        return theme.accent;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeString;
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    alertsContainer: {
      paddingHorizontal: 20,
    },
    alertCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderLeftWidth: 4,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
        web: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      }),
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    alertTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    alertIcon: {
      marginRight: 8,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    alertLevel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      overflow: 'hidden',
    },
    dismissButton: {
      padding: 4,
      marginLeft: 8,
    },
    alertDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 12,
    },
    alertMeta: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    metaIcon: {
      marginRight: 4,
    },
    metaText: {
      fontSize: 12,
      opacity: 0.8,
    },
    alertTime: {
      fontSize: 12,
      fontStyle: 'italic',
      marginTop: 8,
      opacity: 0.7,
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Weather Alerts</Text>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.alertsContainer}
      >
        {alerts.map((alert) => {
          const alertColor = getAlertColor(alert.level);
          
          return (
            <View
              key={alert.alertId}
              style={[
                styles.alertCard,
                {
                  backgroundColor: theme.surface,
                  borderLeftColor: alertColor,
                  minWidth: 300,
                  maxWidth: 350,
                  marginRight: 12,
                },
              ]}
            >
              <View style={styles.alertHeader}>
                <View style={styles.alertTitleContainer}>
                  <View style={styles.alertIcon}>
                    <AlertTriangle size={20} color={alertColor} />
                  </View>
                  <Text style={[styles.alertTitle, { color: theme.text }]}>
                    {alert.title}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text
                    style={[
                      styles.alertLevel,
                      {
                        backgroundColor: alertColor + '20',
                        color: alertColor,
                      },
                    ]}
                  >
                    {alert.level}
                  </Text>
                  
                  {onDismiss && (
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => onDismiss(alert.alertId)}
                    >
                      <X size={16} color={theme.textSecondary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              <Text style={[styles.alertDescription, { color: theme.text }]}>
                {alert.description}
              </Text>

              <View style={styles.alertMeta}>
                {alert.city && (
                  <View style={styles.metaItem}>
                    <View style={styles.metaIcon}>
                      <MapPin size={12} color={theme.textSecondary} />
                    </View>
                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                      {alert.city}
                      {alert.county && `, ${alert.county}`}
                    </Text>
                  </View>
                )}
                
                <View style={styles.metaItem}>
                  <View style={styles.metaIcon}>
                    <Clock size={12} color={theme.textSecondary} />
                  </View>
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {formatTime(alert.startTime)} - {formatTime(alert.endTime)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                Published: {formatTime(alert.publishTime)}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};