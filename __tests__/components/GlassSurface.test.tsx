import React from 'react';
import {
  AccessibilityInfo,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  GlassSurface,
  GlassViewportContext,
  SurfacePreferences,
  WeatherBackdrop,
} from '../../components/GlassSurface';
import { defaultTheme, getTheme, materialFill } from '../../utils/weatherTheme';

it('uses the daylight sky stops only for translucent reading cards', () => {
  function Pane({ night = false, opaque = false }) {
    const theme = getTheme('clouds', false, night);
    const scroll = useSharedValue(0);
    const layout = useSharedValue(0);
    return (
      <WeatherBackdrop theme={theme}>
        <GlassViewportContext.Provider value={{ scroll, layout }}>
          <GlassSurface theme={theme} opaque={opaque}>
            <Text>Forecast</Text>
          </GlassSurface>
          <GlassSurface theme={theme} navigation>
            <Text>Weather</Text>
          </GlassSurface>
        </GlassViewportContext.Provider>
      </WeatherBackdrop>
    );
  }
  const view = render(<Pane />);
  const gradients = view
    .UNSAFE_getAllByType(LinearGradient)
    .filter((g) => g.props.testID === 'daylight-glass');
  expect(gradients).toHaveLength(1);
  expect(gradients[0].props.colors).toEqual(getTheme('clouds').daylightGlass);
  expect(gradients[0].props.locations).toEqual(
    getTheme('clouds').gradientLocations,
  );
  const daylight = () =>
    screen.queryByTestId('daylight-glass', { includeHiddenElements: true });
  view.rerender(<Pane opaque />);
  expect(daylight()).toBeNull();
  view.rerender(<Pane night />);
  expect(daylight()).toBeNull();
});

it('keeps the daylight tint on a collapsed card while the reported scroll offset is still at its old end', () => {
  const makeSharedValue = Reanimated.useSharedValue;
  const shared = jest
    .spyOn(Reanimated, 'useSharedValue')
    .mockImplementation(
      (value) => React.useRef(makeSharedValue(value)).current,
    );
  const measure = jest.spyOn(Reanimated, 'measure');
  const bounds = (pageY: number, height: number) => ({
    pageY,
    height,
    pageX: 0,
    x: 0,
    y: 0,
    width: 360,
  });
  function Card() {
    const scroll = useSharedValue(2800);
    const layout = useSharedValue(0);
    return (
      <WeatherBackdrop theme={defaultTheme}>
        <GlassViewportContext.Provider value={{ scroll, layout }}>
          <GlassSurface theme={defaultTheme} />
        </GlassViewportContext.Provider>
      </WeatherBackdrop>
    );
  }
  try {
    const view = render(<Card />);
    fireEvent(
      screen.getByTestId('daylight-glass', { includeHiddenElements: true }),
      'layout',
    );
    for (const [pageY, height] of [
      [-2500, 3100],
      [160, 148],
    ]) {
      measure
        .mockReturnValueOnce(bounds(pageY, height))
        .mockReturnValueOnce(bounds(0, 780));
      view.rerender(<Card />);
      const styles = view
        .UNSAFE_getAllByType(View)
        .map((node) => StyleSheet.flatten(node.props.style));
      expect(styles).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ transform: [{ translateY: -pageY }] }),
          expect.objectContaining({
            height: '100%',
            backgroundColor: defaultTheme.daylightGlass![0],
          }),
          expect.objectContaining({
            height: '100%',
            backgroundColor: defaultTheme.daylightGlass![2],
          }),
        ]),
      );
    }
  } finally {
    shared.mockRestore();
    measure.mockRestore();
  }
});

it('uses an opaque surface when reduced transparency is requested, keeping text opaque', async () => {
  jest
    .spyOn(AccessibilityInfo, 'isReduceTransparencyEnabled')
    .mockResolvedValue(true);
  render(
    <SurfacePreferences>
      <GlassSurface theme={defaultTheme}>
        <Text>Forecast values</Text>
      </GlassSurface>
    </SurfacePreferences>,
  );
  await waitFor(() =>
    expect(
      screen.getByTestId('glass-fill', { includeHiddenElements: true }),
    ).toHaveStyle({
      backgroundColor: defaultTheme.surface,
    }),
  );
  expect(
    screen.queryByTestId('glass-blur', { includeHiddenElements: true }),
  ).toBeNull();
  expect(screen.getByText('Forecast values')).not.toHaveStyle({
    opacity: 0.72,
  });
  jest.restoreAllMocks();
});
it('provides an opaque dense-chart surface in both appearances', () => {
  const view = render(
    <GlassSurface theme={defaultTheme} opaque>
      <Text>Chart</Text>
    </GlassSurface>,
  );
  expect(
    screen.getByTestId('glass-fill', { includeHiddenElements: true }),
  ).toHaveStyle({
    backgroundColor: '#35779B',
  });
  view.rerender(
    <GlassSurface theme={getTheme('clear', true)} opaque>
      <Text>Chart</Text>
    </GlassSurface>,
  );
  expect(
    screen.getByTestId('glass-fill', { includeHiddenElements: true }),
  ).toHaveStyle({
    backgroundColor: getTheme('clear', true).surface,
  });
});

it('uses a smooth tint for Android reading cards and retains navigation blur on supported versions', () => {
  const os = Object.getOwnPropertyDescriptor(Platform, 'OS')!;
  const version = Object.getOwnPropertyDescriptor(Platform, 'Version')!;
  const night = getTheme('clear', false, true);
  const surfaces = (theme = night, railInset = 0) => (
    <WeatherBackdrop theme={theme} railInset={railInset} showScenery>
      <GlassSurface theme={theme}>
        <Text>Content</Text>
      </GlassSurface>
      <GlassSurface theme={theme} navigation>
        <Text>Navigation</Text>
      </GlassSurface>
    </WeatherBackdrop>
  );
  try {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    Object.defineProperty(Platform, 'Version', {
      configurable: true,
      value: 31,
    });
    const view = render(surfaces());
    const blur = screen.getByTestId('glass-blur', {
      includeHiddenElements: true,
    });
    expect(blur.props.intensity).toBe(35);
    expect(blur.props.blurTarget).toBeDefined();
    expect(blur.props.blurMethod).toBe('dimezisBlurViewSdk31Plus');
    expect(
      screen.getAllByTestId('glass-fill', { includeHiddenElements: true })[0],
    ).toHaveStyle({ backgroundColor: materialFill(night.content) });
    expect(
      screen.getAllByTestId('weather-backdrop', {
        includeHiddenElements: true,
      }),
    ).toHaveLength(1);
    view.rerender(surfaces(defaultTheme));
    expect(
      screen.getAllByTestId('glass-blur', { includeHiddenElements: true }),
    ).toHaveLength(1);
    expect(
      screen.getAllByTestId('glass-fill', { includeHiddenElements: true })[0],
    ).toHaveStyle({
      backgroundColor: materialFill(defaultTheme.content),
    });
    for (const wideTheme of [
      getTheme('clouds'),
      getTheme('thunderstorm', true, true),
    ]) {
      view.rerender(surfaces(wideTheme, 76));
      expect(
        screen.getAllByTestId('glass-blur', { includeHiddenElements: true }),
      ).toHaveLength(1);
      expect(
        screen.getAllByTestId('glass-fill', { includeHiddenElements: true })[0],
      ).toHaveStyle({
        backgroundColor: materialFill(wideTheme.content),
      });
    }
    Object.defineProperty(Platform, 'Version', {
      configurable: true,
      value: 30,
    });
    view.rerender(surfaces(defaultTheme));
    expect(
      screen.queryByTestId('glass-blur', { includeHiddenElements: true }),
    ).toBeNull();
    for (const fill of screen.getAllByTestId('glass-fill', {
      includeHiddenElements: true,
    }))
      expect(fill).toHaveStyle({ backgroundColor: defaultTheme.surface });
  } finally {
    Object.defineProperty(Platform, 'OS', os);
    Object.defineProperty(Platform, 'Version', version);
  }
});
