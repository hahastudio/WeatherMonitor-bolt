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

    const url = `${BASE_URL}/${apiKey}/${coords.longitude},${coords.latitude}/weather?alert=true&dailysteps=1&hourlysteps=48&lang=zh_CN&unit=metric`;
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
      const response = await fetch(url, {
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Helper to map Caiyun skycon to OpenWeatherMap icon code (approximate)
  private getIconFromSkycon(skycon: string): string {
    const map: Record<string, string> = {
      CLEAR_DAY: '01d',
      CLEAR_NIGHT: '01n',
      PARTLY_CLOUDY_DAY: '02d',
      PARTLY_CLOUDY_NIGHT: '02n',
      CLOUDY: '03d', // or 03n
      WIND: '50d', // Mist/Fog/Wind?
      LIGHT_HAZE: '50d',
      MODERATE_HAZE: '50d',
      HEAVY_HAZE: '50d',
      LIGHT_RAIN: '10d',
      MODERATE_RAIN: '10d',
      HEAVY_RAIN: '09d',
      STORM_RAIN: '09d',
      FOG: '50d',
      LIGHT_SNOW: '13d',
      MODERATE_SNOW: '13d',
      HEAVY_SNOW: '13d',
      STORM_SNOW: '13d',
      DUST: '50d',
      SAND: '50d',
      THUNDER_SHOWER: '11d',
      HAIL: '11d',
      SLEET: '13d',
    };
    return map[skycon] || '01d';
  }

  // Helper to map Caiyun skycon to OpenWeatherMap main description
  private getMainFromSkycon(skycon: string): string {
    const map: Record<string, string> = {
      CLEAR_DAY: 'Clear',
      CLEAR_NIGHT: 'Clear',
      PARTLY_CLOUDY_DAY: 'Clouds',
      PARTLY_CLOUDY_NIGHT: 'Clouds',
      CLOUDY: 'Clouds',
      WIND: 'Mist',
      LIGHT_HAZE: 'Haze',
      MODERATE_HAZE: 'Haze',
      HEAVY_HAZE: 'Haze',
      LIGHT_RAIN: 'Rain',
      MODERATE_RAIN: 'Rain',
      HEAVY_RAIN: 'Rain',
      STORM_RAIN: 'Rain',
      FOG: 'Fog',
      LIGHT_SNOW: 'Snow',
      MODERATE_SNOW: 'Snow',
      HEAVY_SNOW: 'Snow',
      STORM_SNOW: 'Snow',
      DUST: 'Dust',
      SAND: 'Sand',
      THUNDER_SHOWER: 'Thunderstorm',
      HAIL: 'Thunderstorm',
      SLEET: 'Snow',
    };
    return map[skycon] || 'Clear';
  }

  transformToCurrentWeather(
    data: CaiyunWeatherResponse,
    coords: LocationCoords,
  ): import('../types/weather').CurrentWeather | null {
    if (!data.result?.realtime) return null;
    const rt = data.result.realtime;

    return {
      coord: {
        lon: coords.longitude,
        lat: coords.latitude,
      },
      weather: [
        {
          id: 0, // Caiyun doesn't provide ID mapping easily
          main: this.getMainFromSkycon(rt.skycon),
          description: rt.skycon.replace(/_/g, ' ').toLowerCase(),
          icon: this.getIconFromSkycon(rt.skycon),
        },
      ],
      base: 'stations',
      main: {
        temp: rt.temperature,
        feels_like: rt.apparent_temperature,
        temp_min: rt.temperature, // Realtime doesn't have min/max
        temp_max: rt.temperature,
        pressure: rt.pressure / 100,
        humidity: rt.humidity * 100, // Caiyun is 0-1, OWM is 0-100
      },
      visibility: rt.visibility * 1000,
      wind: {
        speed: rt.wind.speed,
        deg: rt.wind.direction,
      },
      clouds: {
        all: rt.cloudrate * 100,
      },
      dt: data.server_time,
      sys: {
        country: '',
        sunrise: 0, // Not in realtime
        sunset: 0, // Not in realtime
      },
      timezone: data.tzshift,
      id: 0,
      name: '',
      cod: 200,
    };
  }

  transformToHourlyForecast(
    data: CaiyunWeatherResponse,
  ): import('../types/weather').HourlyForecast[] {
    if (!data.result?.hourly) return [];
    const hourly = data.result.hourly;
    const count = hourly.temperature.length;
    const result: import('../types/weather').HourlyForecast[] = [];

    for (let i = 0; i < count; i++) {
      const dt = new Date(hourly.temperature[i].datetime).getTime() / 1000;
      const skycon = hourly.skycon[i].value;

      result.push({
        dt: dt,
        main: {
          temp: hourly.temperature[i].value,
          feels_like: hourly.temperature[i].value, // Hourly doesn't have feels_like
          temp_min: hourly.temperature[i].value,
          temp_max: hourly.temperature[i].value,
          pressure: hourly.pressure[i].value / 100,
          humidity: hourly.humidity[i].value * 100,
        },
        weather: [
          {
            id: 0,
            main: this.getMainFromSkycon(skycon),
            description: skycon.replace(/_/g, ' ').toLowerCase(),
            icon: this.getIconFromSkycon(skycon),
          },
        ],
        clouds: {
          all: hourly.cloudrate[i].value * 100,
        },
        wind: {
          speed: hourly.wind[i].speed,
          deg: hourly.wind[i].direction,
        },
        visibility: hourly.visibility[i].value * 1000,
        pop: hourly.precipitation[i].value > 0 ? 1 : 0, // Simplified POP
        dt_txt: hourly.temperature[i].datetime,
        sys: {
          sunrise: 0,
          sunset: 0,
          country: '',
        },
        air_quality: hourly.air_quality?.aqi?.[i]?.value
          ? {
              chn: hourly.air_quality.aqi[i].value.chn,
              usa: hourly.air_quality.aqi[i].value.usa,
            }
          : undefined,
      });
    }
    return result;
  }

  mergeCaiyunCurrentWeather(
    base: import('../types/weather').CurrentWeather,
    caiyunData: CaiyunWeatherResponse,
  ): import('../types/weather').CurrentWeather {
    if (!caiyunData.result?.realtime) return base;
    const rt = caiyunData.result.realtime;

    // Create a new object to avoid mutating the base directly if needed,
    // but here we return a new object with merged properties.
    return {
      ...base,
      weather: [
        {
          id: 0,
          main: this.getMainFromSkycon(rt.skycon),
          description: rt.skycon.replace(/_/g, ' ').toLowerCase(),
          icon: this.getIconFromSkycon(rt.skycon),
        },
      ],
      main: {
        ...base.main,
        temp: rt.temperature,
        feels_like: rt.apparent_temperature,
        humidity: rt.humidity * 100,
        // Preserve temp_min and temp_max from base (OpenWeatherMap)
      },
      visibility: rt.visibility * 1000,
      clouds: {
        all: rt.cloudrate * 100,
      },
      dt: caiyunData.server_time,
    };
  }

  mergeCaiyunHourlyForecast(
    base: import('../types/weather').HourlyForecast[],
    caiyunData: CaiyunWeatherResponse,
  ): import('../types/weather').HourlyForecast[] {
    if (!caiyunData.result?.hourly || base.length === 0) return base;

    const caiyunHourly = this.transformToHourlyForecast(caiyunData);
    if (caiyunHourly.length === 0) return base;

    const mergedHourly = [...base];
    let updatesCount = 0;

    // Iterate through all Caiyun hourly data to merge AQI and short-term weather
    for (const ch of caiyunHourly) {
      // Find corresponding hour in base data
      // Match if within 30 minutes
      const matchIndex = mergedHourly.findIndex(
        (h) => Math.abs(h.dt - ch.dt) < 1800,
      );

      if (matchIndex !== -1) {
        let original = mergedHourly[matchIndex];

        // Merge AQI for ALL matched hours
        if (ch.air_quality) {
          original = {
            ...original,
            air_quality: ch.air_quality,
          };
        }

        // Merge weather data only for the first 4 hours
        if (updatesCount < 4) {
          original = {
            ...original,
            // Update fields from Caiyun
            main: {
              ...original.main,
              temp: ch.main.temp,
              humidity: ch.main.humidity,
              // Preserve feels_like, temp_min, temp_max from original
            },
            weather: ch.weather,
            clouds: ch.clouds,
            // Preserve wind from original (OpenWeatherMap)
            wind: original.wind,
            visibility: ch.visibility,
            pop: ch.pop,
            // Preserve sys, dt_txt, rain, snow from original
          };
          updatesCount++;
        }

        mergedHourly[matchIndex] = original;
      }
    }

    return mergedHourly;
  }
}

export const caiyunService = new CaiyunService();
