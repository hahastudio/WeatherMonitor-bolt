import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useWeather } from '../contexts/WeatherContext';
import {
  calculateDay,
  calculateInstant,
  solarPeriodAt,
} from '../services/astronomyService';
import { resolveAstronomyObserver } from '../utils/astronomySnapshot';
import { addLocalDays, localDateAt, onLocalDate } from '../utils/astronomyTime';

export function useAstronomy() {
  const { location, forecast, currentWeather } = useWeather();
  const observer = useMemo(
    () => resolveAstronomyObserver(location, forecast, currentWeather),
    [location, forecast, currentWeather],
  );
  const observerKey = observer
    ? `${observer.latitude}:${observer.longitude}`
    : '';
  const [nowUtcMs, setNowUtcMs] = useState(Date.now);
  const [preview, setPreview] = useState<{
    observerKey: string;
    atUtcMs: number;
  } | null>(null);
  const isLive = !preview || preview.observerKey !== observerKey;
  const atUtcMs = isLive ? nowUtcMs : preview.atUtcMs;

  // Screen-local clock: nothing here fetches weather or writes to global context.
  useFocusEffect(
    useCallback(() => {
      let timer: ReturnType<typeof setInterval> | undefined;
      const stop = () => {
        if (timer) clearInterval(timer);
        timer = undefined;
      };
      const resume = (state: string | null) => {
        stop();
        if (state !== null && state !== 'active') return;
        setNowUtcMs(Date.now());
        if (isLive) timer = setInterval(() => setNowUtcMs(Date.now()), 60_000);
      };
      resume(AppState.currentState);
      const subscription = AppState.addEventListener('change', resume);
      return () => {
        stop();
        subscription.remove();
      };
    }, [isLive]),
  );

  const localDate = observer ? localDateAt(atUtcMs, observer.zone) : '';
  const today = observer ? localDateAt(nowUtcMs, observer.zone) : '';
  const dayResult = useMemo(() => {
    if (!observer) return { day: null, error: null };
    try {
      return { day: calculateDay(observer, localDate), error: null };
    } catch {
      return {
        day: null,
        error:
          'Astronomy calculations are unavailable for this date and location.',
      };
    }
  }, [observer, localDate]);
  const instantResult = useMemo(() => {
    if (!observer) return { instant: null, error: null };
    try {
      return { instant: calculateInstant(observer, atUtcMs), error: null };
    } catch {
      return {
        instant: null,
        error: 'The selected sky position could not be calculated.',
      };
    }
  }, [observer, atUtcMs]);
  const period = dayResult.day
    ? solarPeriodAt(dayResult.day, atUtcMs)
    : 'unknown';
  const lastPeriod = useRef<{ observerKey: string; moonFirst: boolean } | null>(
    null,
  );
  const moonFirst =
    period === 'unknown'
      ? lastPeriod.current?.observerKey === observerKey &&
        lastPeriod.current.moonFirst
      : period === 'night';
  useEffect(() => {
    if (period !== 'unknown')
      lastPeriod.current = { observerKey, moonFirst: period === 'night' };
  }, [observerKey, period]);

  const selectTime = useCallback(
    (time: number) => {
      if (!dayResult.day || !Number.isFinite(time)) return;
      setPreview({
        observerKey,
        atUtcMs: Math.max(
          dayResult.day.startUtcMs,
          Math.min(
            dayResult.day.endUtcMs - 1,
            Math.round(time / 60_000) * 60_000,
          ),
        ),
      });
    },
    [dayResult.day, observerKey],
  );
  const selectDate = (direction: -1 | 1) => {
    if (!observer) return;
    const target = addLocalDays(localDate, direction);
    if (target < today || target > addLocalDays(today, 7)) return;
    setPreview({
      observerKey,
      atUtcMs: onLocalDate(atUtcMs, target, observer.zone),
    });
  };
  const goLive = () => {
    setNowUtcMs(Date.now());
    setPreview(null);
  };

  return {
    observer,
    day: dayResult.day,
    instant: instantResult.instant,
    error: dayResult.error || instantResult.error,
    atUtcMs,
    isLive,
    period,
    moonFirst,
    localDate,
    today,
    selectTime,
    selectDate,
    goLive,
  };
}
