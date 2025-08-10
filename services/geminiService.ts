import { GoogleGenAI } from '@google/genai';
import { CurrentWeather, ForecastResponse, CaiyunWeatherAlert, CaiyunAirQuality, HourlyForecast, DailyForecast } from '../types/weather';
import { apiLogger } from './apiLogger';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface WeatherSummaryInput {
  currentWeather: CurrentWeather;
  forecast: ForecastResponse;
  alerts: CaiyunWeatherAlert[];
  airQuality: CaiyunAirQuality | null;
  cityName: string;
}

export interface WeatherSummary {
  todayOverview: string;
  alertSummary: string | null;
  futureWarnings: string | null;
  recommendations: string[];
  mood: 'positive' | 'neutral' | 'warning' | 'severe';
}

class GeminiService {
  private genAI: GoogleGenAI | null = null;

  constructor() {
    if (API_KEY && API_KEY !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenAI({apiKey: API_KEY});
    }
  }

  async generateWeatherSummary(
    input: WeatherSummaryInput,
    trigger: 'manual' | 'auto' | 'tab_switch' | 'app_start' = 'manual'
  ): Promise<WeatherSummary> {
    if (!this.genAI) {
      throw new Error('Gemini API key not configured. Please add your API key to .env file.');
    }

    const startTime = Date.now();

    try {
      const prompt = this.buildPrompt(input);
      
      const result = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              todayOverview: { type: 'string' },
              alertSummary: { type: 'string', nullable: true },
              futureWarnings: { type: 'string', nullable: true },
              recommendations: { type: 'array', items: { type: 'string' } },
              mood: { type: 'string', enum: ['positive', 'neutral', 'warning', 'severe'] },
            },
            required: ['todayOverview', 'recommendations', 'mood'],
          }
        }
      });
      const responseTime = Date.now() - startTime;
      const text = result.text || '';

      await apiLogger.logRequest(
        'generateWeatherSummary (Gemini)',
        'POST',
        'success',
        trigger,
        responseTime,
        undefined,
        'gemini'
      );

      return this.parseResponse(text);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      await apiLogger.logRequest(
        'generateWeatherSummary (Gemini)',
        'POST',
        'error',
        trigger,
        responseTime,
        error instanceof Error ? error.message : 'Unknown error',
        'gemini'
      );
      throw error;
    }
  }

  private buildHourlyForecastSummary(forecast: HourlyForecast): string {
    const date = new Date(forecast.dt * 1000);
    const hours = date.getHours();
    var result = '';
    if (hours === 0)
      result += `- ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 0:00\n`;
    else
      result += `- ${hours}:00\n`;
    result += `  - Temperature: ${forecast.main.temp}°C, feels like: ${forecast.main.feels_like}°C,\n`;
    result += `  - Condition: ${forecast.weather[0].description}\n`;
    result += `  - Humidity: ${forecast.main.humidity}%\n`;
    result += `  - Pressure: ${forecast.main.pressure} hPa\n`;
    result += `  - Wind: ${forecast.wind.speed} m/s, direction: ${forecast.wind.deg}°\n`;
    result += `  - Precipitation Probability: ${(forecast.pop * 100).toFixed(0)}%\n`;
    result += `  - Rain: ${forecast.rain?.['1h'] ? forecast.rain['1h'].toFixed(2) : '0'} mm\n`;
    result += `  - Snow: ${forecast.snow?.['1h'] ? forecast.snow['1h'].toFixed(2) : '0'} mm\n`;
    return result;
  }

  private buildDailyForecastSummary(forecast: DailyForecast): string {
    const date = new Date(forecast.dt * 1000);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
    const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
    let result = `- ${dayOfWeek}, ${monthDay}\n`;
    result += `  - Temperature: Low ${forecast.main.temp_min}°C High ${forecast.main.temp_max}°C\n`;
    result += `  - Condition: ${forecast.weather[0].description}\n`;
    result += `  - Humidity: ${forecast.main.humidity}%\n`;
    result += `  - Pressure: ${forecast.main.pressure} hPa\n`;
    result += `  - Wind: ${forecast.wind.speed} m/s, direction: ${forecast.wind.deg}°\n`;
    result += `  - Precipitation Probability: ${(forecast.pop * 100).toFixed(0)}%\n`;
    result += `  - Rain: ${forecast.rain ? forecast.rain.toFixed(2) : '0'} mm\n`;
    result += `  - Snow: ${forecast.snow ? forecast.snow.toFixed(2) : '0'} mm\n`;
    return result;
  }

  private buildPrompt(input: WeatherSummaryInput): string {
    const { currentWeather, forecast, alerts, cityName } = input;
    
    // Get today's forecast data
    const today = new Date();
    const todayForecasts = forecast.hourly.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toDateString() === today.toDateString();
    });

    // Get next 24 hours forecast
    const next24Hours = forecast.hourly.slice(0, 24);

    // Get next 5 days forecast for bad weather detection
    const next5Days = forecast.daily.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toDateString() !== today.toDateString();
    }).slice(0, 5);

    // Build weather data summary
    const currentTemp = Math.round(currentWeather.main.temp);
    const feelsLike = Math.round(currentWeather.main.feels_like);
    const condition = currentWeather.weather[0].description;
    const humidity = currentWeather.main.humidity;
    const windSpeed = currentWeather.wind.speed;
    const visibility = currentWeather.visibility / 1000;

    // Today's temperature range
    const todayTemps = todayForecasts.map(f => f.main.temp);
    const todayMin = todayTemps.length > 0 ? Math.round(Math.min(...todayTemps)) : currentTemp;
    const todayMax = todayTemps.length > 0 ? Math.round(Math.max(...todayTemps)) : currentTemp;

    // Precipitation data
    const todayPrecip = todayForecasts.reduce((sum, f) => {
      const rain = f.rain?.['1h'] || 0;
      const snow = f.snow?.['1h'] || 0;
      return sum + rain + snow;
    }, 0);

    // Future bad weather detection
    /*
    const badWeatherEvents = next5Days.filter(item => {
      const rain = item.rain || 0;
      const snow = item.snow || 0;
      const windSpeed = item.wind.speed;
      const condition = item.weather[0].main.toLowerCase();
      
      return (
        rain > 1 || // Rain
        snow > 1 || // Snow
        windSpeed > 10 || // Strong wind
        condition.includes('thunderstorm') ||
        condition.includes('storm')
      );
    });
    */

    // Alert information
    const alertInfo = alerts.length > 0 
      ? alerts.map(alert => `${alert.title}: ${alert.description}`).join('\n')
      : 'No active weather alerts';
    
    // Air quality information
    const airQuality = input.airQuality?.aqi?.usa || 'N/A';

    const localeOptions: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false
    };

    const prompt = `
You are a professional meteorologist providing a weather summary for ${cityName}. Generate a comprehensive weather analysis in JSON format.

CURRENT TIME:
${today.toLocaleString('en-US', localeOptions)}

CURRENT WEATHER:
- Temperature: ${currentTemp}°C (feels like ${feelsLike}°C)
- Condition: ${condition}
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s
- Visibility: ${visibility} km
- Air Quality Index: ${airQuality}

TODAY'S FORECAST:
- Temperature Range: ${todayMin}°C to ${todayMax}°C
- Expected Precipitation: ${todayPrecip.toFixed(1)} mm

FORECAST FOR NEXT 24 HOURS:
${next24Hours.map(f => this.buildHourlyForecastSummary(f)).join('') || '  None'}

FUTURE 5-DAY FORECAST:
${next5Days.map(f => this.buildDailyForecastSummary(f)).join('') || '  None'}

WEATHER ALERTS:
${alertInfo}

FUTURE BAD WEATHER STANDARDS:
- Rain: > 5mm in a day
- Snow: > 3mm in a day
- Wind: > 10 m/s
- Severe conditions: thunderstorms, storms
- Temperature extremes: heatwaves, cold waves
- Temperature changes: > 5°C compared to previous day

Please provide a JSON response with the following structure:
{
  "todayOverview": "A 2-3 sentence summary of today's weather conditions and what to expect",
  "alertSummary": "Summary of current weather alerts (null if no alerts)",
  "futureWarnings": "Warning about upcoming bad weather in the following days (null if no bad weather expected)",
  "recommendations": ["Array of 2-4 practical recommendations based on the weather"],
  "mood": "positive|neutral|warning|severe"
}

Guidelines:
- Keep language natural and conversational
- Focus on practical impact for daily activities
- Be specific about timing when relevant
- Use appropriate mood based on weather severity
- Include temperature comfort level
- Mention any notable weather changes expected
- For alerts, explain the practical implications
- For future warnings, specify which days and what type of weather
- Recommendations should be actionable (e.g., "Carry an umbrella", "Wear a jacket")
- Answer in Chinese, using simplified characters
`;
    return prompt;
  }

  private parseResponse(text: string): WeatherSummary {
    try {
      const parsed = JSON.parse(text);
      
      // Validate the response structure
      if (!parsed.todayOverview || !Array.isArray(parsed.recommendations)) {
        throw new Error('Invalid response structure');
      }

      return {
        todayOverview: parsed.todayOverview,
        alertSummary: parsed.alertSummary || null,
        futureWarnings: parsed.futureWarnings || null,
        recommendations: parsed.recommendations || [],
        mood: parsed.mood || 'neutral',
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      
      // Fallback response
      return {
        todayOverview: "Weather data is available. Check the details below for current conditions.",
        alertSummary: null,
        futureWarnings: null,
        recommendations: ["Check the detailed weather information", "Stay updated with weather changes"],
        mood: 'neutral',
      };
    }
  }
}

export const geminiService = new GeminiService();