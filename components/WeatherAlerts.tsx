import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  TriangleAlert as AlertTriangle,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { CaiyunWeatherAlert } from '../types/weather';

interface WeatherAlertsProps {
  alerts: CaiyunWeatherAlert[];
  onDismiss?: (alertId: string) => void;
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

const getTimestampInMs = (timestamp?: number | string): number => {
  if (!timestamp) {
    return 0;
  }

  if (typeof timestamp === 'number') {
    // Caiyun uses Unix seconds, but accept milliseconds defensively.
    return timestamp > 1000000000000 ? timestamp : timestamp * 1000;
  }

  const parsedTimestamp = new Date(timestamp).getTime();
  return Number.isNaN(parsedTimestamp) ? 0 : parsedTimestamp;
};

const getAlertTimestamp = (alert: CaiyunWeatherAlert): number =>
  getTimestampInMs(alert.pubtimestamp) ||
  getTimestampInMs(alert.publishTime) ||
  getTimestampInMs(alert.startTime) ||
  getTimestampInMs(alert.endTime);

const formatTime = (timestamp: number | string) => {
  try {
    const timestampInMs = getTimestampInMs(timestamp);

    if (!timestampInMs) {
      return String(timestamp);
    }

    const date = new Date(timestampInMs);

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

const formatLevelLabel = (level: string) => level.replace(/_/g, ' ');

const getBadgeTextColor = (level: string) =>
  ['yellow', 'watch'].includes(level.toLowerCase()) ? '#2A2100' : '#FFFFFF';

export const WeatherAlerts: React.FC<WeatherAlertsProps> = ({ alerts }) => {
  const { theme } = useWeather();
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(new Set());
  const sortedAlerts = useMemo(
    () =>
      [...(alerts || [])].sort(
        (a, b) => getAlertTimestamp(b) - getAlertTimestamp(a),
      ),
    [alerts],
  );

  if (!alerts || alerts.length === 0) {
    return null;
  }

  const toggleAlert = (alertId: string) => {
    const newExpanded = new Set(expandedAlerts);
    if (newExpanded.has(alertId)) {
      newExpanded.delete(alertId);
    } else {
      newExpanded.add(alertId);
    }
    setExpandedAlerts(newExpanded);
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

  const styles = StyleSheet.create({
    container: {
      marginVertical: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
    },
    sectionMeta: {
      color: theme.textSecondary,
      fontSize: 12,
      fontWeight: '500',
    },
    alertsContainer: {
      paddingHorizontal: 20,
    },
    alertCard: {
      borderRadius: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.textSecondary + '20',
      overflow: 'hidden',
    },
    severityRail: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      top: 0,
      width: 5,
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 14,
      paddingLeft: 16,
      paddingRight: 12,
      paddingTop: 14,
    },
    severityBadge: {
      alignItems: 'center',
      borderRadius: 14,
      flexDirection: 'row',
      marginRight: 4,
      paddingHorizontal: 10,
      paddingVertical: 8,
    },
    severityText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.5,
      marginLeft: 6,
      textTransform: 'uppercase',
    },
    alertTitleContainer: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '700',
      lineHeight: 21,
    },
    alertPublished: {
      fontSize: 12,
      fontWeight: '500',
      marginTop: 4,
    },
    collapseButton: {
      alignItems: 'center',
      borderRadius: 14,
      height: 28,
      justifyContent: 'center',
      marginLeft: 10,
      width: 28,
    },
    alertContent: {
      paddingBottom: 16,
      paddingHorizontal: 16,
      paddingTop: 0,
    },
    alertContentDivider: {
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '15',
      paddingTop: 14,
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
      marginTop: 8,
      opacity: 0.7,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Weather Alerts</Text>
      </View>

      <View style={styles.alertsContainer}>
        {sortedAlerts.map((alert) => {
          const alertColor = getAlertColor(alert);
          const rawAlertLevel = extractAlertLevel(alert);
          const alertLevel = formatLevelLabel(rawAlertLevel);
          const badgeTextColor = getBadgeTextColor(rawAlertLevel);
          const isExpanded = expandedAlerts.has(alert.alertId);

          return (
            <View
              key={alert.alertId}
              style={[
                styles.alertCard,
                {
                  backgroundColor: theme.surface,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.alertHeader}
                onPress={() => toggleAlert(alert.alertId)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: alertColor },
                  ]}
                >
                  <AlertTriangle
                    size={16}
                    color={badgeTextColor}
                    strokeWidth={2.8}
                  />
                  <Text
                    style={[styles.severityText, { color: badgeTextColor }]}
                  >
                    {alertLevel}
                  </Text>
                </View>

                <View style={styles.alertTitleContainer}>
                  <Text
                    style={[styles.alertTitle, { color: theme.text }]}
                    numberOfLines={isExpanded ? undefined : 2}
                  >
                    {alert.title}
                  </Text>
                </View>

                <View style={styles.collapseButton}>
                  {isExpanded ? (
                    <ChevronUp size={18} color={theme.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={theme.textSecondary} />
                  )}
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.alertContent}>
                  <View style={styles.alertContentDivider}>
                    <Text
                      style={[styles.alertDescription, { color: theme.text }]}
                    >
                      {alert.description}
                    </Text>

                    <View style={styles.alertMeta}>
                      <View style={styles.metaItem}>
                        <View style={styles.metaIcon}>
                          <MapPin size={12} color={theme.textSecondary} />
                        </View>
                        <Text
                          style={[
                            styles.metaText,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {alert.location || `${alert.city}, ${alert.county}`}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[styles.alertTime, { color: theme.textSecondary }]}
                    >
                      Source: {alert.source}
                    </Text>
                    <Text
                      style={[styles.alertTime, { color: theme.textSecondary }]}
                    >
                      Published {formatTime(alert.pubtimestamp)}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
};
