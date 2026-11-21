import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import {
  Sparkles,
  TriangleAlert as AlertTriangle,
  ThumbsDown,
  ThumbsUp,
  Cloud,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Lightbulb,
} from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { GlassSurface } from './GlassSurface';
import { useNow } from '../hooks/useNow';

export const WeatherSummary: React.FC = () => {
  const {
    currentWeather,
    forecast,
    weatherSummary,
    summaryGeneratedAt,
    theme,
    generateWeatherSummary,
  } = useWeather();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const now = useNow();

  const handleGenerateSummary = async () => {
    if (!currentWeather || !forecast) return;

    setLoading(true);
    setError(null);

    try {
      await generateWeatherSummary();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate weather summary',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCardPress = () => {
    if (weatherSummary && !loading) {
      setExpanded(!expanded);
    }
  };

  const handleRefreshPress = (event: GestureResponderEvent) => {
    // Prevent the card press event from firing
    event.stopPropagation();
    handleGenerateSummary();
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'positive':
        return <ThumbsUp size={16} color={theme.success} />;
      case 'warning':
        return <ThumbsDown size={16} color={theme.warning} />;
      case 'severe':
        return <AlertTriangle size={16} color={theme.danger} />;
      default:
        return <Cloud size={16} color={theme.textSecondary} />;
    }
  };

  const formatGeneratedTime = (timestamp: number | null): string => {
    if (!timestamp) return '';

    const diffMs = now - timestamp;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
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

  const styles = StyleSheet.create({
    container: {
      overflow: 'hidden',
    },
    cardTouchable: {
      // Make the entire card tappable
    },
    cardContent: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    title: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      marginLeft: 8,
      flexShrink: 1,
    },
    generatedTime: {
      color: theme.textSecondary,
      fontSize: 12,
      fontStyle: 'italic',
    },
    moodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    refreshButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.selection,
      marginRight: 8,
    },
    expandIndicator: {
      padding: 4,
      opacity: weatherSummary ? 1 : 0.3,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginLeft: 8,
    },
    errorContainer: {
      paddingVertical: 12,
    },
    errorText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 8,
    },
    retryButton: {
      backgroundColor: theme.selection,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 16,
      alignSelf: 'center',
    },
    retryButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      gap: 12,
    },
    overviewText: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 22,
    },
    summarySection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: theme.divider,
      paddingTop: 12,
    },
    sectionTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 6,
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    alertText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    warningText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    recommendationsTitle: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    recommendationsTitleText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    recommendation: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    bullet: {
      color: theme.primary,
      fontSize: 14,
      marginRight: 6,
      marginTop: 2,
    },
    recommendationText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      flex: 1,
    },
    moodIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    moodText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    tapHint: {
      color: theme.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 8,
      fontStyle: 'italic',
    },
  });

  if (!currentWeather || !forecast) {
    return null;
  }

  return (
    <GlassSurface theme={theme} style={styles.container}>
      <TouchableOpacity
        testID="weather-summary-card"
        accessibilityRole="button"
        accessibilityLabel="AI weather summary"
        accessibilityState={{ expanded }}
        aria-expanded={expanded}
        style={styles.cardTouchable}
        onPress={handleCardPress}
        activeOpacity={0.7}
        disabled={!weatherSummary || loading}
      >
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Sparkles size={20} color={theme.primary} />
              <Text style={styles.title}>AI Weather Summary</Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                testID="refresh-summary-button"
                accessibilityRole="button"
                accessibilityLabel="Refresh weather summary"
                style={styles.refreshButton}
                onPress={handleRefreshPress}
                disabled={loading}
                activeOpacity={0.7}
              >
                <RefreshCw
                  size={16}
                  color={loading ? theme.textSecondary : theme.primary}
                />
              </TouchableOpacity>

              <View style={styles.expandIndicator}>
                {expanded ? (
                  <ChevronUp size={16} color={theme.textSecondary} />
                ) : (
                  <ChevronDown size={16} color={theme.textSecondary} />
                )}
              </View>
            </View>
          </View>

          {loading && (
            <View style={styles.loadingContainer} testID="loading-container">
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Generating AI summary...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer} testID="error-container">
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                testID="retry-summary-button"
                style={styles.retryButton}
                onPress={handleGenerateSummary}
              >
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}

          {weatherSummary && (
            <View style={styles.content}>
              <View style={styles.moodRow}>
                <View testID="summary-mood" style={styles.moodIndicator}>
                  {getMoodIcon(weatherSummary.mood)}
                  <Text style={styles.moodText}>{weatherSummary.mood}</Text>
                </View>
                {summaryGeneratedAt && (
                  <Text style={styles.generatedTime}>
                    {formatGeneratedTime(summaryGeneratedAt)}
                  </Text>
                )}
              </View>

              <Text style={styles.overviewText}>
                {weatherSummary.todayOverview}
              </Text>

              {weatherSummary.alertSummary && (
                <View style={styles.summarySection}>
                  <View style={styles.sectionTitleRow}>
                    <AlertTriangle size={16} color={theme.warning} />
                    <Text style={styles.sectionTitle}>
                      Active Weather Alerts
                    </Text>
                  </View>
                  <Text style={styles.alertText}>
                    {weatherSummary.alertSummary}
                  </Text>
                </View>
              )}

              {expanded && (
                <View testID="expanded-content" style={styles.content}>
                  {weatherSummary.futureWarnings && (
                    <View style={styles.summarySection}>
                      <View style={styles.sectionTitleRow}>
                        <Cloud size={16} color={theme.danger} />
                        <Text style={styles.sectionTitle}>
                          Upcoming Weather Concerns
                        </Text>
                      </View>
                      <Text style={styles.warningText}>
                        {weatherSummary.futureWarnings}
                      </Text>
                    </View>
                  )}

                  <View style={styles.summarySection}>
                    <View style={styles.recommendationsTitle}>
                      <Lightbulb size={16} color={theme.primary} />
                      <Text style={styles.recommendationsTitleText}>
                        Recommendations
                      </Text>
                    </View>
                    {weatherSummary.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendation}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    </GlassSurface>
  );
};
