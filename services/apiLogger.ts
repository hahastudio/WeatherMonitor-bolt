import { saveApiLogs, loadApiLogs, clearApiLogs } from '../utils/weatherStorage';

export interface ApiLogEntry {
  id: string;
  timestamp: number;
  endpoint: string;
  method: string;
  status: 'success' | 'error';
  responseTime?: number;
  error?: string;
  trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start';
  provider: 'openweather' | 'caiyun' | 'gemini';
}

export interface ApiLogSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requestsByTrigger: Record<ApiLogEntry['trigger'], number>;
  requestsByProvider: Record<ApiLogEntry['provider'], number>;
  requestsByHour: Array<{ hour: string; count: number }>;
  averageResponseTime: number;
}

class ApiLogger {
  private static readonly MAX_LOG_AGE = 48 * 60 * 60 * 1000; // 48 hours in milliseconds

  async logRequest(
    endpoint: string,
    method: string = 'GET',
    status: 'success' | 'error' = 'success',
    trigger: ApiLogEntry['trigger'] = 'manual',
    responseTime?: number,
    error?: string,
    provider: ApiLogEntry['provider'] = 'openweather'
  ): Promise<void> {
    try {
      const entry: ApiLogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        endpoint,
        method,
        status,
        responseTime,
        error,
        trigger,
        provider,
      };

      const existingLogs = await this.getLogs();
      const updatedLogs = [entry, ...existingLogs];
      
      // Keep only logs from the last 48 hours
      const cutoffTime = Date.now() - ApiLogger.MAX_LOG_AGE;
      const filteredLogs = updatedLogs.filter(log => log.timestamp > cutoffTime);

      await saveApiLogs(filteredLogs);
    } catch (error) {
      console.error('Failed to log API request:', error);
    }
  }

  async getLogs(): Promise<ApiLogEntry[]> {
    try {
      const logs = await loadApiLogs();
      if (!logs) return [];

      // Filter out logs older than 48 hours
      const cutoffTime = Date.now() - ApiLogger.MAX_LOG_AGE;
      return logs.filter(log => log.timestamp > cutoffTime);
    } catch (error) {
      console.error('Failed to retrieve API logs:', error);
      return [];
    }
  }

  async getLogsSummary(): Promise<ApiLogSummary> {
    const logs = await this.getLogs();
    
    const summary = {
      totalRequests: logs.length,
      successfulRequests: logs.filter(log => log.status === 'success').length,
      failedRequests: logs.filter(log => log.status === 'error').length,
      requestsByTrigger: {
        manual: 0,
        auto: 0,
        tab_switch: 0,
        app_start: 0,
      } as Record<ApiLogEntry['trigger'], number>,
      requestsByProvider: {
        openweather: 0,
        caiyun: 0,
        gemini: 0,
      } as Record<ApiLogEntry['provider'], number>,
      requestsByHour: [] as Array<{ hour: string; count: number }>,
      averageResponseTime: 0,
    };

    // Count requests by trigger and provider
    logs.forEach(log => {
      summary.requestsByTrigger[log.trigger]++;
      summary.requestsByProvider[log.provider]++;
    });

    // Calculate average response time
    const logsWithResponseTime = logs.filter(log => log.responseTime !== undefined);
    if (logsWithResponseTime.length > 0) {
      const totalResponseTime = logsWithResponseTime.reduce((sum, log) => sum + (log.responseTime || 0), 0);
      summary.averageResponseTime = totalResponseTime / logsWithResponseTime.length;
    }

    // Group requests by hour for the last 48 hours
    const hourlyRequests = new Map<string, number>();
    const now = new Date();
    
    // Initialize all hours in the last 48 hours
    for (let i = 47; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hourKey = hour.toISOString().slice(0, 13); // YYYY-MM-DDTHH
      hourlyRequests.set(hourKey, 0);
    }

    // Count actual requests
    logs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const hourKey = logDate.toISOString().slice(0, 13);
      const currentCount = hourlyRequests.get(hourKey) || 0;
      hourlyRequests.set(hourKey, currentCount + 1);
    });

    // Convert to array format
    summary.requestsByHour = Array.from(hourlyRequests.entries()).map(([hour, count]) => ({
      hour: new Date(hour + ':00:00.000Z').toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        hour12: true,
      }),
      count,
    }));

    return summary;
  }

  async clearLogs(): Promise<void> {
    try {
      await clearApiLogs();
    } catch (error) {
      console.error('Failed to clear API logs:', error);
    }
  }
}

export const apiLogger = new ApiLogger();