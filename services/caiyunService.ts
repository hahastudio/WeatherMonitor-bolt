import { fetch } from 'expo/fetch';
import { CaiyunWeatherResponse, LocationCoords } from '../types/weather';
import { apiLogger } from './apiLogger';
import { getApiKey } from './apiKeyManager';

const BASE_URL = 'https://api.caiyunapp.com/v2.5';

export class CaiyunService {
  async getWeatherData(
    coords: LocationCoords,
    trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual',
  ): Promise<CaiyunWeatherResponse> {
    const apiKey = getApiKey('caiyun');
    if (!apiKey) {
      throw new Error(
        'Caiyun API key not configured. Please add it in the settings.',
      );
    }

    const url = `${BASE_URL}/${apiKey}/${coords.longitude},${coords.latitude}/weather?alert=true&lang=zh_CN&unit=metric`;
    const startTime = Date.now();

    try {
      console.log('🌐 Loading weather alerts...');
      const response = await fetch(url);
      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        console.log(
          `❌ Error fetching weather alerts: ${response.status} ${response.statusText}`,
        );
        await apiLogger.logRequest(
          'getWeatherAlerts (Caiyun)',
          'GET',
          'error',
          trigger,
          responseTime,
          `${response.status} ${response.statusText}`,
          'caiyun',
        );
        throw new Error(
          `Caiyun API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log('✅ Got weather alerts successfully');
      await apiLogger.logRequest(
        'getWeatherAlerts (Caiyun)',
        'GET',
        'success',
        trigger,
        responseTime,
        undefined,
        'caiyun',
      );
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
        'caiyun',
      );
      throw error;
    }
  }

  async validateApiKey(apiKey: string): Promise<boolean> {
    const url = `${BASE_URL}/${apiKey}/0,0/weather?alert=true&lang=zh_CN&unit=metric`;
    try {
      const response = await fetch(url);
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const caiyunService = new CaiyunService();
