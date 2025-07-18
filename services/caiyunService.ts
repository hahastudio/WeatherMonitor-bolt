import { fetch } from 'expo/fetch';
import { CaiyunWeatherResponse, LocationCoords } from '../types/weather';
import { apiLogger } from './apiLogger';

const API_KEY = process.env.EXPO_PUBLIC_CAIYUN_API_KEY;
const BASE_URL = 'https://api.caiyunapp.com/v2.5';

class CaiyunService {
  
  async getWeatherData(coords: LocationCoords, trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'): Promise<CaiyunWeatherResponse> {
    if (!API_KEY || API_KEY === 'your_caiyun_api_key_here') {
      throw new Error('Caiyun API key not configured. Please add your API key to .env file.');
    }

    const url = `${BASE_URL}/${API_KEY}/${coords.longitude},${coords.latitude}/weather?alert=true&lang=zh_CN&unit=metric`;
    const startTime = Date.now();
    
    try {
      console.log('🌐 Loading weather alerts...');
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;
      
      if (!response.ok) {
        console.log(`❌ Error fetching weather alerts: ${response.status} ${response.statusText}`);
        await apiLogger.logRequest(
          'getWeatherAlerts (Caiyun)',
          'GET',
          'error',
          trigger,
          responseTime,
          `${response.status} ${response.statusText}`,
          'caiyun'
        );
        throw new Error(`Caiyun API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Got weather alerts successfully');
      await apiLogger.logRequest('getWeatherAlerts (Caiyun)', 'GET', 'success', trigger, responseTime, undefined, 'caiyun');
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await apiLogger.logRequest(
        'getWeatherAlerts (Caiyun)',
        'GET',
        'error',
        trigger,
        responseTime,
        error instanceof Error ? error.message : 'Unknown error',
        'caiyun'
      );
      throw error;
    }
  }
}

export const caiyunService = new CaiyunService();