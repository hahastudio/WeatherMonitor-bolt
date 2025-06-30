import { GoogleGenerativeAI } from '@google/generative-ai';
import { CurrentWeather, ForecastResponse, CaiyunWeatherAlert } from '../types/weather';
import { apiLogger } from './apiLogger';

const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

interface WeatherSummaryInput {
  currentWeather: CurrentWeather;
  forecast: ForecastResponse;
  alerts: CaiyunWeatherAlert[];
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
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    if (API_KEY && API_KEY !== 'your_gemini_api_key_here') {
      this.genAI = new GoogleGenerativeAI(API_KEY);
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
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = this.buildPrompt(input);
      
      const result = await model.generateContent(prompt);
      const responseTime = Date.now() - startTime;
      
      const response = await result.response;
      const text = response.text();

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

  private buildPrompt(input: WeatherSummaryInput): string {
    const { currentWeather, forecast, alerts, cityName } = input;
    
    // Get today's forecast data
    const today = new Date();
    const todayForecasts = forecast.list.filter(item => {
      const itemDate = new Date(item.dt * 1000);
      return itemDate.toDateString() === today.toDateString();
    });

    // Get next 5 days forecast for bad weather detection
    const next5Days = forecast.list.slice(0, 40); // 5 days * 8 forecasts per day

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
      const rain = f.rain?.['3h'] || 0;
      const snow = f.snow?.['3h'] || 0;
      return sum + rain + snow;
    }, 0);

    // Future bad weather detection
    const badWeatherEvents = next5Days.filter(item => {
      const rain = item.rain?.['3h'] || 0;
      const snow = item.snow?.['3h'] || 0;
      const windSpeed = item.wind.speed;
      const condition = item.weather[0].main.toLowerCase();
      
      return (
        rain > 5 || // Heavy rain
        snow > 2 || // Snow
        windSpeed > 10 || // Strong wind
        condition.includes('thunderstorm') ||
        condition.includes('storm')
      );
    });

    // Alert information
    const alertInfo = alerts.length > 0 
      ? alerts.map(alert => `${alert.title}: ${alert.description}`).join('\n')
      : 'No active weather alerts';

    const prompt = `
You are a professional meteorologist providing a weather summary for ${cityName}. Generate a comprehensive weather analysis in JSON format.

CURRENT WEATHER:
- Temperature: ${currentTemp}°C (feels like ${feelsLike}°C)
- Condition: ${condition}
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s
- Visibility: ${visibility} km

TODAY'S FORECAST:
- Temperature Range: ${todayMin}°C to ${todayMax}°C
- Expected Precipitation: ${todayPrecip.toFixed(1)} mm
- Number of forecast points: ${todayForecasts.length}

WEATHER ALERTS:
${alertInfo}

FUTURE BAD WEATHER (Next 5 Days):
${badWeatherEvents.length > 0 
  ? badWeatherEvents.slice(0, 3).map(event => {
      const date = new Date(event.dt * 1000).toLocaleDateString();
      const rain = event.rain?.['3h'] || 0;
      const snow = event.snow?.['3h'] || 0;
      return `${date}: ${event.weather[0].description}, Rain: ${rain}mm, Snow: ${snow}mm, Wind: ${event.wind.speed}m/s`;
    }).join('\n')
  : 'No significant bad weather expected in the next 5 days'
}

Please provide a JSON response with the following structure:
{
  "todayOverview": "A 2-3 sentence summary of today's weather conditions and what to expect",
  "alertSummary": "Summary of current weather alerts (null if no alerts)",
  "futureWarnings": "Warning about upcoming bad weather in next 5 days (null if no bad weather expected)",
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
`;

    return prompt;
  }

  private parseResponse(text: string): WeatherSummary {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
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