import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {
  Activity,
  CircleCheck as CheckCircle,
  Circle as XCircle,
  Clock,
  Trash2,
  RefreshCw,
  MousePointer,
  Smartphone,
  Cloud,
  Globe,
  Sparkles,
} from 'lucide-react-native';
import { useWeather } from '../contexts/WeatherContext';
import { apiLogger, ApiLogEntry, ApiLogSummary } from '../services/apiLogger';

interface ApiLogViewerProps {
  onClear: () => void;
  logVersion: number;
}

export const ApiLogViewer: React.FC<ApiLogViewerProps> = ({
  onClear,
  logVersion,
}) => {
  const { theme } = useWeather();
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [summary, setSummary] = useState<ApiLogSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const [logsData, summaryData] = await Promise.all([
        apiLogger.getLogs(),
        apiLogger.getLogsSummary(),
      ]);
      setLogs(logsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load API logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [logVersion]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.textSecondary + '20',
    },
    title: {
      color: theme.text,
      fontSize: 20,
      fontWeight: '600',
      flex: 1,
    },
    actionsSection: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.textSecondary + '20',
    },
    actionButtonContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 20,
      backgroundColor: theme.surface,
      borderRadius: 20,
    },
    actionButtonText: {
      color: theme.text,
      marginLeft: 10,
      fontSize: 14,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    summaryCard: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginVertical: 16,
    },
    summaryTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    summaryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    summaryItem: {
      width: '48%',
      marginBottom: 12,
    },
    summaryLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      marginBottom: 4,
    },
    summaryValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '700',
    },
    triggerSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '20',
    },
    triggerItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    triggerLabel: {
      color: theme.textSecondary,
      fontSize: 14,
      flexDirection: 'row',
      alignItems: 'center',
    },
    triggerValue: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
    },
    providerSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: theme.textSecondary + '20',
    },
    sectionTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    logItem: {
      backgroundColor: theme.surface,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      borderLeftWidth: 4,
    },
    logItemSuccess: {
      borderLeftColor: '#4CAF50',
    },
    logItemError: {
      borderLeftColor: '#F44336',
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    logEndpoint: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    logTime: {
      color: theme.textSecondary,
      fontSize: 12,
    },
    logDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    logTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logTriggerText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginLeft: 4,
    },
    logProvider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: 12,
    },
    logProviderText: {
      color: theme.textSecondary,
      fontSize: 12,
      marginLeft: 4,
    },
    logStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    logStatusText: {
      fontSize: 12,
      marginLeft: 4,
      fontWeight: '500',
    },
    logStatusSuccess: {
      color: '#4CAF50',
    },
    logStatusError: {
      color: '#F44336',
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 12,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 16,
      textAlign: 'center',
      marginTop: 20,
    },
  });

  const getTriggerIcon = (trigger: ApiLogEntry['trigger']) => {
    switch (trigger) {
      case 'manual':
        return <MousePointer size={12} color={theme.textSecondary} />;
      case 'auto':
        return <Clock size={12} color={theme.textSecondary} />;
      case 'tab_switch':
        return <Activity size={12} color={theme.textSecondary} />;
      case 'app_start':
        return <Smartphone size={12} color={theme.textSecondary} />;
      default:
        return <Activity size={12} color={theme.textSecondary} />;
    }
  };

  const getProviderIcon = (provider: ApiLogEntry['provider']) => {
    switch (provider) {
      case 'openweather':
        return <Cloud size={12} color={theme.textSecondary} />;
      case 'caiyun':
        return <Globe size={12} color={theme.textSecondary} />;
      case 'gemini':
        return <Sparkles size={12} color={theme.textSecondary} />;
      default:
        return <Activity size={12} color={theme.textSecondary} />;
    }
  };

  const formatTriggerLabel = (trigger: ApiLogEntry['trigger']) => {
    switch (trigger) {
      case 'manual':
        return 'Manual Refresh';
      case 'auto':
        return 'Auto Refresh';
      case 'tab_switch':
        return 'Tab Switch';
      case 'app_start':
        return 'App Start';
      default:
        return trigger;
    }
  };

  const formatProviderLabel = (provider: ApiLogEntry['provider']) => {
    switch (provider) {
      case 'openweather':
        return 'OpenWeather';
      case 'caiyun':
        return 'Caiyun';
      case 'gemini':
        return 'Gemini AI';
      default:
        return provider;
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatResponseTime = (responseTime?: number) => {
    if (!responseTime || isNaN(responseTime)) return '';
    return responseTime < 1000
      ? `${responseTime}ms`
      : `${(responseTime / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>API Request Log</Text>
        </View>
        <Text style={styles.loadingText}>Loading API logs...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>API Request Log</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.actionsSection}>
          <TouchableOpacity
            testID="refresh-button"
            style={styles.actionButtonContainer}
            onPress={loadLogs}
          >
            <RefreshCw size={20} color={theme.primary} />
            <Text style={styles.actionButtonText}>Refresh</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="clear-logs-button"
            style={styles.actionButtonContainer}
            onPress={onClear}
          >
            <Trash2 size={20} color={theme.accent} />
            <Text style={styles.actionButtonText}>Clear Logs</Text>
          </TouchableOpacity>
        </View>

        {summary && (
          <View testID="summary-card" style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Last 48 Hours Summary</Text>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Requests</Text>
                <Text style={styles.summaryValue}>{summary.totalRequests}</Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Success Rate</Text>
                <Text style={styles.summaryValue}>
                  {summary.totalRequests > 0
                    ? Math.round(
                        (summary.successfulRequests / summary.totalRequests) *
                          100,
                      )
                    : 0}
                  %
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Failed Requests</Text>
                <Text style={styles.summaryValue}>
                  {summary.failedRequests}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Avg Response</Text>
                <Text style={styles.summaryValue}>
                  {formatResponseTime(summary.averageResponseTime || 0)}
                </Text>
              </View>
            </View>

            <View style={styles.triggerSection}>
              <Text style={[styles.summaryLabel, { marginBottom: 8 }]}>
                Requests by Trigger
              </Text>

              {Object.entries(summary.requestsByTrigger).map(
                ([trigger, count]) => (
                  <View key={trigger} style={styles.triggerItem}>
                    <View style={styles.triggerLabel}>
                      {getTriggerIcon(trigger as ApiLogEntry['trigger'])}
                      <Text style={[styles.triggerLabel, { marginLeft: 6 }]}>
                        {formatTriggerLabel(trigger as ApiLogEntry['trigger'])}
                      </Text>
                    </View>
                    <Text style={styles.triggerValue}>{count}</Text>
                  </View>
                ),
              )}
            </View>

            <View style={styles.providerSection}>
              <Text style={[styles.summaryLabel, { marginBottom: 8 }]}>
                Requests by Provider
              </Text>

              {Object.entries(summary.requestsByProvider).map(
                ([provider, count]) => (
                  <View key={provider} style={styles.triggerItem}>
                    <View style={styles.triggerLabel}>
                      {getProviderIcon(provider as ApiLogEntry['provider'])}
                      <Text style={[styles.triggerLabel, { marginLeft: 6 }]}>
                        {formatProviderLabel(
                          provider as ApiLogEntry['provider'],
                        )}
                      </Text>
                    </View>
                    <Text style={styles.triggerValue}>{count}</Text>
                  </View>
                ),
              )}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Recent Requests</Text>

        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Activity size={48} color={theme.textSecondary} />
            <Text style={styles.emptyText}>
              No API requests logged yet.{'\n'}
              Requests will appear here as you use the app.
            </Text>
          </View>
        ) : (
          <View testID="log-list">
            {logs.slice(0, 50).map((log) => (
              <View
                key={log.id}
                style={[
                  styles.logItem,
                  log.status === 'success'
                    ? styles.logItemSuccess
                    : styles.logItemError,
                ]}
              >
                <View style={styles.logHeader}>
                  <Text style={styles.logEndpoint}>{log.endpoint}</Text>
                  <Text style={styles.logTime}>
                    {formatTime(log.timestamp)}
                  </Text>
                </View>

                <View style={styles.logDetails}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.logTrigger}>
                      {getTriggerIcon(log.trigger)}
                      <Text style={styles.logTriggerText}>
                        {formatTriggerLabel(log.trigger)}
                      </Text>
                    </View>

                    <View style={styles.logProvider}>
                      {getProviderIcon(log.provider)}
                      <Text style={styles.logProviderText}>
                        {formatProviderLabel(log.provider)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.logStatus}>
                    {log.status === 'success' ? (
                      <CheckCircle size={12} color="#4CAF50" />
                    ) : (
                      <XCircle size={12} color="#F44336" />
                    )}
                    <Text
                      style={[
                        styles.logStatusText,
                        log.status === 'success'
                          ? styles.logStatusSuccess
                          : styles.logStatusError,
                      ]}
                    >
                      {log.status === 'success'
                        ? formatResponseTime(log.responseTime)
                        : 'Error'}
                    </Text>
                  </View>
                </View>

                {log.error && (
                  <Text
                    style={[
                      styles.logTriggerText,
                      { marginTop: 4, color: theme.accent },
                    ]}
                  >
                    {log.error}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};
