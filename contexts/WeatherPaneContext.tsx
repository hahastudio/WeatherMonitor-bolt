import { createContext, useContext } from 'react';

export type WeatherPane = 'current' | 'forecast' | 'air-quality';
export const WeatherPaneContext = createContext<WeatherPane>('current');
export const useWeatherPane = () => useContext(WeatherPaneContext);
