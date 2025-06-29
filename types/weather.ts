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
  rain?: {
    '3h': number;
  };
  snow?: {
    '3h': number;
  };
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

// Caiyun API Weather Alert Types - Updated to match actual mock data structure
export interface CaiyunWeatherAlert {
  alertId: string;
  title: string;
  description: string;
  status: string;
  code: string;
  province: string;
  city: string;
  county: string;
  location: string;
  source: string;
  pubtimestamp: number;
  latlon: [number, number];
  adcode: string;
  regionId: string;
  request_status: string;
  // Optional fields that might be extracted from title
  level?: string;
  type?: string;
  publishTime?: string;
  startTime?: string;
  endTime?: string;
}

export interface CaiyunAlertsResponse {
  status: string;
  api_version: string;
  api_status: string;
  lang: string;
  unit: string;
  tzshift: number;
  timezone: string;
  server_time: number;
  location: [number, number];
  result?: {
    alert?: {
      status: string;
      content: CaiyunWeatherAlert[];
    };
  };
}

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle' | 'mist' | 'fog';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}