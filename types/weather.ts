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

export interface RainInfo {
  '1h'?: number;
  '3h'?: number;
}

export interface SnowInfo {
  '1h'?: number;
  '3h'?: number;
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
  rain?: RainInfo;
  snow?: SnowInfo;
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
  sys: {
    sunrise: number;
    sunset: number;
    country: string;
  };
  rain?: {
    '1h': number;
  };
  snow?: {
    '1h': number;
  };
}

export interface DailyForecast {
  dt: number;
  main: MainWeatherInfo;
  weather: WeatherData[];
  clouds: CloudsInfo;
  wind: WindInfo;
  pop: number;
  dt_txt: string;
  rain?: number;
  snow?: number;
}

export interface ForecastResponse {
  cod: string;
  message: number;
  cnt: number;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
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

export interface OneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    rain?: {
      '1h': number;
    };
    snow?: {
      '1h': number;
    };
  };
  hourly: Array<{
    dt: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    pop: number;
    rain?: {
      '1h': number;
    };
    snow?: {
      '1h': number;
    };
  }>;
  daily: Array<{
    dt: number;
    sunrise: number;
    sunset: number;
    moonrise: number;
    moonset: number;
    moon_phase: number;
    summary: string;
    temp: {
      day: number;
      min: number;
      max: number;
      night: number;
      eve: number;
      morn: number;
    };
    feels_like: {
      day: number;
      night: number;
      eve: number;
      morn: number;
    };
    pressure: number;
    humidity: number;
    dew_point: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
    clouds: number;
    pop: number;
    rain?: number;
    snow?: number;
    uvi: number;
  }>;
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

export interface CaiyunAirQuality {
  aqi: {
    chn: number;
    usa: number;
  };
}

export interface CaiyunWeatherResponse {
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
    realtime?: {
      air_quality?: CaiyunAirQuality
    }
  };
}

export type WeatherCondition = 'clear' | 'clouds' | 'rain' | 'snow' | 'thunderstorm' | 'drizzle' | 'mist' | 'fog';

export interface LocationCoords {
  latitude: number;
  longitude: number;
}