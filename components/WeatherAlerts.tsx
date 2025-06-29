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

  const extractAlertLevel = (alert: CaiyunWeatherAlert): string => {
    // If level is provided directly, use it
    if (alert.level) {
      return alert.level;
    }

    // Extract level from title (e.g., "黄色预警" -> "yellow", "红色预警" -> "red")
    const title = alert.title?.toLowerCase() || '';
    
    if (title.includes('红色') || title.includes('red')) {
      return 'red';
    } else if (title.includes('橙色') || title.includes('orange')) {
      return 'orange';
    } else if (title.includes('黄色') || title.includes('yellow')) {
      return 'yellow';
    } else if (title.includes('蓝色') || title.includes('blue')) {
      return 'blue';
    } else if (title.includes('severe')) {
      return 'severe';
    } else if (title.includes('warning')) {
      return 'warning';
    } else if (title.includes('watch')) {
      return 'watch';
    } else if (title.includes('advisory')) {
      return 'advisory';
    }
    
    // Default fallback
    return 'warning';
  };

  const getAlertColor = (alert: CaiyunWeatherAlert) => {
    const level = extractAlertLevel(alert);
    
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

  const formatTime = (timestamp: number | string) => {
    try {
      // Handle both timestamp (number) and ISO string
      const date = typeof timestamp === 'number' 
        ? new Date(timestamp * 1000) // Convert Unix timestamp to milliseconds
        : new Date(timestamp);
        
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return String(timestamp);
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
    statusBadge: {
      fontSize: 11,
      fontWeight: '600',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3,
      marginLeft: 8,
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
          const alertColor = getAlertColor(alert);
          const alertLevel = extractAlertLevel(alert);
          
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
                    {alertLevel}
                  </Text>
                  
                  <Text
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: alert.status === '预警中' ? '#FF8800' + '20' : theme.textSecondary + '20',
                        color: alert.status === '预警中' ? '#FF8800' : theme.textSecondary,
                      },
                    ]}
                  >
                    {alert.status}
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
                <View style={styles.metaItem}>
                  <View style={styles.metaIcon}>
                    <MapPin size={12} color={theme.textSecondary} />
                  </View>
                  <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                    {alert.location || `${alert.city}, ${alert.county}`}
                  </Text>
                </View>
              </View>

              <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                Published: {formatTime(alert.pubtimestamp)}
              </Text>
              
              <Text style={[styles.alertTime, { color: theme.textSecondary }]}>
                Source: {alert.source}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};