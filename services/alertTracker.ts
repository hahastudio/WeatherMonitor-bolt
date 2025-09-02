import {
  saveAlertTracker,
  loadAlertTracker,
  clearAlertTracker,
} from '../utils/weatherStorage';

export interface AlertTracker {
  recentAlertIds: string[];
  lastUpdated: number;
}

class AlertTrackerService {
  private static readonly MAX_RECENT_ALERTS = 100;
  private static readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  async getRecentAlertIds(): Promise<string[]> {
    try {
      const tracker = await loadAlertTracker();
      if (!tracker) return [];

      // Clean up old data if needed
      const now = Date.now();
      if (now - tracker.lastUpdated > AlertTrackerService.CLEANUP_INTERVAL) {
        // Reset if data is older than 24 hours
        return [];
      }

      return tracker.recentAlertIds || [];
    } catch (error) {
      console.error('Failed to get recent alert IDs:', error);
      return [];
    }
  }

  async addAlertId(alertId: string): Promise<void> {
    try {
      const recentAlertIds = await this.getRecentAlertIds();

      // Check if alert ID already exists
      if (recentAlertIds.includes(alertId)) {
        return;
      }

      // Add new alert ID to the beginning of the array
      const updatedAlertIds = [alertId, ...recentAlertIds];

      // Keep only the most recent MAX_RECENT_ALERTS
      const trimmedAlertIds = updatedAlertIds.slice(
        0,
        AlertTrackerService.MAX_RECENT_ALERTS,
      );

      const tracker: AlertTracker = {
        recentAlertIds: trimmedAlertIds,
        lastUpdated: Date.now(),
      };

      await saveAlertTracker(tracker);
    } catch (error) {
      console.error('Failed to add alert ID:', error);
    }
  }

  async addMultipleAlertIds(alertIds: string[]): Promise<void> {
    try {
      const recentAlertIds = await this.getRecentAlertIds();

      // Filter out alert IDs that already exist
      const newAlertIds = alertIds.filter((id) => !recentAlertIds.includes(id));

      if (newAlertIds.length === 0) {
        return;
      }

      // Add new alert IDs to the beginning of the array
      const updatedAlertIds = [...newAlertIds, ...recentAlertIds];

      // Keep only the most recent MAX_RECENT_ALERTS
      const trimmedAlertIds = updatedAlertIds.slice(
        0,
        AlertTrackerService.MAX_RECENT_ALERTS,
      );

      const tracker: AlertTracker = {
        recentAlertIds: trimmedAlertIds,
        lastUpdated: Date.now(),
      };

      await saveAlertTracker(tracker);
    } catch (error) {
      console.error('Failed to add multiple alert IDs:', error);
    }
  }

  async isAlertIdRecent(alertId: string): Promise<boolean> {
    try {
      const recentAlertIds = await this.getRecentAlertIds();
      return recentAlertIds.includes(alertId);
    } catch (error) {
      console.error('Failed to check if alert ID is recent:', error);
      return false;
    }
  }

  async filterNewAlerts(alertIds: string[]): Promise<string[]> {
    try {
      const recentAlertIds = await this.getRecentAlertIds();
      return alertIds.filter((id) => !recentAlertIds.includes(id));
    } catch (error) {
      console.error('Failed to filter new alerts:', error);
      return alertIds; // Return all if error occurs
    }
  }

  async clearRecentAlerts(): Promise<void> {
    try {
      await clearAlertTracker();
    } catch (error) {
      console.error('Failed to clear recent alerts:', error);
    }
  }

  async getTrackerStats(): Promise<{
    totalTrackedAlerts: number;
    oldestAlertAge: number | null;
    newestAlertAge: number | null;
  }> {
    try {
      const tracker = await loadAlertTracker();
      if (!tracker) {
        return {
          totalTrackedAlerts: 0,
          oldestAlertAge: null,
          newestAlertAge: null,
        };
      }
      const now = Date.now();
      return {
        totalTrackedAlerts: tracker.recentAlertIds.length,
        oldestAlertAge: tracker.lastUpdated ? now - tracker.lastUpdated : null,
        newestAlertAge: tracker.lastUpdated ? now - tracker.lastUpdated : null,
      };
    } catch (error) {
      console.error('Failed to get tracker stats:', error);
      return {
        totalTrackedAlerts: 0,
        oldestAlertAge: null,
        newestAlertAge: null,
      };
    }
  }
}

export const alertTracker = new AlertTrackerService();
