import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Sparkles, TriangleAlert as AlertTriangle, CloudRain, Sun, Cloud, RefreshCw, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { geminiService, WeatherSummary as WeatherSummaryType } from '../services/geminiService';

export const WeatherSummary: React.FC = () => {
  const { 
    currentWeather, 
    forecast, 
    weatherAlerts, 
    cityName, 
    theme 
  } = useWeather();

  const [summary, setSummary] = useState<WeatherSummaryType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const generateSummary = async () => {
    if (!currentWeather || !forecast) return;

    setLoading(true);
    setError(null);

    try {
      const summaryData = await geminiService.generateWeatherSummary({
        currentWeather,
        forecast,
        alerts: weatherAlerts,
        cityName,
      }, 'manual');

      setSummary(summaryData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate weather summary');
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate summary when weather data is available
  useEffect(() => {
    if (currentWeather && forecast && !summary && !loading) {
      generateSummary();
    }
  }, [currentWeather, forecast, weatherAlerts]);

  const getMoodIcon = (mood: WeatherSummaryType['mood']) => {
    switch (mood) {
      case 'positive':
        return <Sun size={20} color={theme.primary} />;
      case 'warning':
        return <CloudRain size={20} color="#FF8800" />;
      case 'severe':
        return <AlertTriangle size={20} color="#FF4444" />;
      default:
        return <Cloud size={20} color={theme.primary} />;
    }
  };

  const getMoodColor = (mood: WeatherSummaryType['mood']) => {
    switch (mood) {
      case 'positive':
        return '#4CAF50';
      case 'warning':
        return '#FF8800';
      case 'severe':
        return '#FF4444';
      default:
        return theme.primary;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.surface + '90',
      borderRadius: 16,
      padding: 16,
      marginVertical: 16,
      // CRITICAL: Remove all shadow/elevation properties to prevent Android grey borders
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
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    refreshButton: {
      padding: 4,
      marginRight: 8,
    },
    expandButton: {
      padding: 4,
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
      color: theme.accent,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 8,
    },
    retryButton: {
      backgroundColor: theme.primary + '20',
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
    alertSection: {
      backgroundColor: '#FF8800' + '15',
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#FF8800',
    },
    alertTitle: {
      color: '#FF8800',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    alertText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    warningSection: {
      backgroundColor: '#FF4444' + '15',
      borderRadius: 8,
      padding: 12,
      borderLeftWidth: 4,
      borderLeftColor: '#FF4444',
    },
    warningTitle: {
      color: '#FF4444',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    warningText: {
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
    },
    recommendationsSection: {
      backgroundColor: theme.primary + '10',
      borderRadius: 8,
      padding: 12,
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
      alignSelf: 'flex-start',
      backgroundColor: theme.background + '50',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      marginTop: 8,
    },
    moodText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
      textTransform: 'capitalize',
    },
  });

  if (!currentWeather || !forecast) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={20} color={theme.primary} />
          <Text style={styles.title}>AI Weather Summary</Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={generateSummary}
            disabled={loading}
          >
            <RefreshCw 
              size={16} 
              color={loading ? theme.textSecondary : theme.primary} 
            />
          </TouchableOpacity>
          
          {summary && (
            <TouchableOpacity 
              style={styles.expandButton} 
              onPress={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp size={16} color={theme.textSecondary} />
              ) : (
                <ChevronDown size={16} color={theme.textSecondary} />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text style={styles.loadingText}>Generating AI summary...</Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={generateSummary}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {summary && (
        <View style={styles.content}>
          <Text style={styles.overviewText}>{summary.todayOverview}</Text>

          {summary.alertSummary && (
            <View style={styles.alertSection}>
              <Text style={styles.alertTitle}>⚠️ Active Weather Alerts</Text>
              <Text style={styles.alertText}>{summary.alertSummary}</Text>
            </View>
          )}

          {expanded && (
            <>
              {summary.futureWarnings && (
                <View style={styles.warningSection}>
                  <Text style={styles.warningTitle}>🌩️ Upcoming Weather Concerns</Text>
                  <Text style={styles.warningText}>{summary.futureWarnings}</Text>
                </View>
              )}

              <View style={styles.recommendationsSection}>
                <View style={styles.recommendationsTitle}>
                  <Lightbulb size={16} color={theme.primary} />
                  <Text style={styles.recommendationsTitleText}>Recommendations</Text>
                </View>
                {summary.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendation}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.moodIndicator}>
                {getMoodIcon(summary.mood)}
                <Text style={[styles.moodText, { color: getMoodColor(summary.mood) }]}>
                  {summary.mood}
                </Text>
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
};