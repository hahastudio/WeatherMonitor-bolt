import { createContext, useContext } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const FloatingNavigationHeightContext = createContext<number | null>(
  null,
);

export function adaptiveLayout(width: number, height: number, fontScale = 1) {
  const rail = width >= 600;
  const railWidth = rail ? Math.max(76, Math.ceil(64 * fontScale)) : 0;
  const contentWidth = width - railWidth;
  const columns =
    rail &&
    width >= 720 &&
    height >= 400 &&
    contentWidth - 44 >= 2 * 280 * Math.max(1, fontScale);
  return {
    rail,
    railWidth,
    columns,
    contentWidth,
    fontScale,
    navigationHeight: Math.max(64, 40 + 14 * fontScale),
  };
}

export function useAdaptiveLayout() {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const measuredHeight = useContext(FloatingNavigationHeightContext);
  const layout = adaptiveLayout(
    width - insets.left - insets.right,
    height,
    fontScale,
  );
  return {
    ...layout,
    navigationHeight: measuredHeight ?? layout.navigationHeight,
  };
}
