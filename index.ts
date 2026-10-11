import { Platform } from 'react-native';
import BackgroundFetch from 'react-native-background-fetch';
import './node_modules/expo-router/entry';
import { weatherTask } from './services/backgroundWeatherService';

if (Platform.OS !== 'web') {
  console.log('Registering headless background fetch task...');
  BackgroundFetch.registerHeadlessTask(async (event) => {
    // Get task id from event {}:
    const taskId = event.taskId;
    const isTimeout = event.timeout; // <-- true when your background-time has expired.
    if (isTimeout) {
      // This task has exceeded its allowed running-time.
      // You must stop what you're doing immediately finish(taskId)
      console.log('[BackgroundFetch] Headless TIMEOUT:', taskId);
      BackgroundFetch.finish(taskId);
      return;
    }
    console.log('[BackgroundFetch HeadlessTask] start: ', taskId);
    await weatherTask(taskId);
  });
}
