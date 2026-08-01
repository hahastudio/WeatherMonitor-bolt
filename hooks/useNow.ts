import { useEffect, useState } from 'react';

/**
 * Returns the current epoch time in milliseconds, refreshed on an interval.
 *
 * Reading `Date.now()` directly during render is impure and triggers cascading
 * re-renders under the React Compiler. This hook snapshots the time in state and
 * advances it on a timer so relative-time displays stay accurate and pure.
 *
 * @param intervalMs How often to refresh the value. Defaults to 60s.
 */
export function useNow(intervalMs: number = 60_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
