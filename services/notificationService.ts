import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CaiyunWeatherAlert } from '../types/weather';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // Request browser notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
        return false;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async showWeatherAlert(alert: CaiyunWeatherAlert): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Weather Alert: ${alert.title}`, {
            body: alert.description,
            icon: '/assets/images/icon.png',
            tag: 'weather-alert',
          });
        }
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Weather Alert: ${alert.title}`,
          body: alert.description,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing weather alert:', error);
    }
  }

  async showGeneralNotification(title: string, body: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/assets/images/icon.png',
          });
        }
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }
}

export const notificationService = new NotificationService();