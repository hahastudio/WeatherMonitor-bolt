import { calculateInstant } from '../services/astronomyService';
import { resolveAstronomyObserver } from './astronomySnapshot';
import type {
  CurrentWeather,
  ForecastResponse,
  LocationCoords,
} from '../types/weather';

/** Offline, location-aware daylight, including polar days and stale sunrise data. */
export function isWeatherNight(
  weather: CurrentWeather | null,
  forecast: ForecastResponse | null,
  location: LocationCoords | null,
  now: number,
): boolean {
  const observer = resolveAstronomyObserver(location, forecast, weather);
  if (observer) {
    try {
      return calculateInstant(observer, now).sun.altitudeDeg < -0.833;
    } catch {
      // Keep provider data usable if astronomy cannot calculate this instant.
    }
  }
  const sunrise = weather?.sys.sunrise;
  const sunset = weather?.sys.sunset;
  const seconds = now / 1000;
  if (
    sunrise !== undefined &&
    sunset !== undefined &&
    sunset > sunrise &&
    Math.abs(seconds - sunrise) < 86400
  ) {
    return seconds < sunrise || seconds >= sunset;
  }
  return weather?.weather[0]?.icon.endsWith('n') ?? false;
}
