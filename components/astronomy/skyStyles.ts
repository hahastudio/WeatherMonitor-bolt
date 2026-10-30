import { StyleSheet } from 'react-native';
import type { WeatherTheme } from '../../utils/weatherTheme';

export function skyColors(theme: WeatherTheme) {
  const dark = theme.text.toUpperCase() === '#FFFFFF';
  return {
    sun: dark ? '#FFD166' : '#9B5800',
    moon: dark ? '#9EC8EF' : '#35638D',
    line: theme.text + '25',
    sea: dark ? '#253E52' : '#E3EDF4',
    land: dark ? '#76909F' : '#BBCDD9',
    night: '#050A10',
    phaseDark: '#34475A',
    phaseLit: '#F4DDAD',
  };
}

export const skyStyles = StyleSheet.create({
  section: { padding: 16, borderRadius: 12, marginBottom: 12 },
  heading: { fontSize: 20, fontWeight: '600', flexShrink: 1 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  spread: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  value: { fontSize: 22, fontWeight: '500', fontVariant: ['tabular-nums'] },
  body: { fontSize: 14, lineHeight: 21 },
  caption: { fontSize: 12, lineHeight: 18 },
  button: {
    minHeight: 44,
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
