export interface WeatherData {
  id: number;
  main: string;
  description: string;
  icon: string;
}

export interface MainWeatherInfo {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  humidity: number;
  sea_level?: number;
  grnd_level?: number;
}

export interface WindInfo {
  speed: number;
  deg: number;
  gust?: number;
}

export interface CloudsInfo {
  all: number;
}

export interface SysInfo {
  type?: number;
  id?: number;
  country: string;
  sunrise: number;
  sunset: number;
}

export interface CurrentWeather {
  coord: {
    lon: number;
    lat: number;
  };
  weather: WeatherData[];
  base: string;
  main: MainWeatherInfo;
  visibility: number;
  wind: WindInfo;
  clouds: CloudsInfo;
  dt: number;
  sys: SysInfo;
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

export interface HourlyForecast {
  dt: number;
  main: MainWeatherInfo;
  weather: WeatherData[];
  clouds: CloudsInfo;
  wind: WindInfo;
  visibility: number;
  pop: number;
  dt_txt: string;
}

export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  list: HourlyForecast[];
  city: {
    id: number;
    name: string;
    coord: {
      lat: number;
      lon: number;
    };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle' | 'mist' | 'fog';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}