import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text } from 'react-native';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import * as Reanimated from 'react-native-reanimated';
import { ScrollingScreen } from '../../components/ScrollingScreen';
import { defaultTheme } from '../../utils/weatherTheme';

const mockNavigate = jest.fn();
const mockAdaptiveLayout = { rail: false, navigationHeight: 64 };
jest.mock('../../hooks/useAdaptiveLayout', () => ({
  useAdaptiveLayout: () => mockAdaptiveLayout,
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ navigate: mockNavigate }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));

// Run the component's scroll worklets synchronously for interaction tests.
// Device rendering and native pull activation are outside this mock's scope.

describe('ScrollingScreen', () => {
  beforeEach(() => {
    mockAdaptiveLayout.rail = false;
    const makeSharedValue = Reanimated.useSharedValue;
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(
        (value) => React.useRef(makeSharedValue(value)).current,
      );
    jest.spyOn(Reanimated, 'useAnimatedScrollHandler').mockImplementation(
      (handler) =>
        ((event: { nativeEvent: Parameters<Reanimated.ScrollHandler>[0] }) => {
          if (typeof handler === 'function') handler(event.nativeEvent, {});
        }) as unknown as ReturnType<typeof Reanimated.useAnimatedScrollHandler>,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const renderScreen = (
    props: Partial<React.ComponentProps<typeof ScrollingScreen>> = {},
  ) =>
    render(
      <ScrollingScreen theme={defaultTheme} title="Weather Forecast" {...props}>
        <Text>First forecast</Text>
        <Text>Last forecast</Text>
      </ScrollingScreen>,
    );

  const scrollTo = (y: number) =>
    fireEvent.scroll(screen.getByTestId('screen-scroll'), {
      nativeEvent: { contentOffset: { x: 0, y } },
    });

  it('scrolls the expanded title and body together with safe-area spacing', () => {
    renderScreen({ bottomInset: true });
    const scroll = screen.getByTestId('screen-scroll');
    expect(within(scroll).getByText('Weather Forecast')).toBeTruthy();
    expect(within(scroll).getByText('Last forecast')).toBeTruthy();
    expect(scroll).toHaveStyle({ marginTop: 47 });
    expect(scroll.props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 12, paddingBottom: 58 }),
      ]),
    );
    expect(screen.getAllByRole('header')).toHaveLength(1);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
    scrollTo(200);
    expect(within(scroll).getByRole('header')).toHaveTextContent(
      'Weather Forecast',
    );
    expect(screen.getAllByRole('header')).toHaveLength(1);
    expect(
      screen.queryByTestId('screen-compact-header', {
        includeHiddenElements: true,
      }),
    ).toBeNull();
  });

  it('keeps the back action available after scrolling', () => {
    const onBack = jest.fn();
    renderScreen({ onBack });
    scrollTo(200);
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('keeps Settings in the scrolling title row', () => {
    renderScreen({ showSettings: true });
    fireEvent.press(
      within(screen.getByTestId('screen-scroll')).getByRole('button', {
        name: 'Open settings',
      }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
    scrollTo(200);
    expect(
      within(screen.getByTestId('screen-expanded-header')).getByRole('button', {
        name: 'Open settings',
      }),
    ).toBeTruthy();
    scrollTo(0);
    expect(screen.getByRole('button', { name: 'Open settings' })).toBeTruthy();
  });

  it('does not show a manual refresh indicator for background loading', () => {
    const onRefresh = jest.fn();
    renderScreen({ onRefresh, refreshBusy: true });
    const control = screen.UNSAFE_getByType(RefreshControl);
    expect(control.props.refreshing).toBe(false);
    expect(control.props.progressViewOffset).toBe(
      StyleSheet.flatten(
        screen.getByTestId('screen-expanded-header').props.style,
      ).minHeight,
    );
    fireEvent(control, 'refresh');
    expect(onRefresh).not.toHaveBeenCalled();
    expect(control.props.enabled).toBe(false);
    expect(
      screen.queryByRole('button', { name: 'Refresh weather' }),
    ).toBeNull();
  });

  it('ignores repeated pulls while refreshing and settles the indicator', async () => {
    let finish: () => void = () => {};
    const onRefresh = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderScreen({ onRefresh });
    fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(true);
    await act(async () => finish());
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(
      false,
    );
    expect(screen.UNSAFE_getByType(RefreshControl).props.enabled).toBe(true);
  });

  it('recovers from a failed refresh and allows retry', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onRefresh = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);
    renderScreen({ onRefresh });
    fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    await waitFor(() =>
      expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(
        false,
      ),
    );
    fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    await waitFor(() => expect(onRefresh).toHaveBeenCalledTimes(2));
  });

  it('shares one refresh between independent panes and keeps it running when folded', async () => {
    let finish: () => void = () => {};
    const onRefresh = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    const Workspace = ({ columns }: { columns: boolean }) => (
      <ScrollingScreen
        theme={defaultTheme}
        title="Weather"
        fillViewport={columns}
        onRefresh={onRefresh}
      >
        {(refreshControl) => (
          <>
            <ScrollView refreshControl={columns ? refreshControl : undefined}>
              <Text>Current</Text>
            </ScrollView>
            <ScrollView refreshControl={columns ? refreshControl : undefined}>
              <Text>Forecast</Text>
            </ScrollView>
          </>
        )}
      </ScrollingScreen>
    );
    const view = render(<Workspace columns />);
    const activeControls = () =>
      screen
        .UNSAFE_getAllByType(RefreshControl)
        .filter((control) => control.props.onRefresh);
    const controls = activeControls();
    expect(controls).toHaveLength(2);
    fireEvent(controls[0], 'refresh');
    fireEvent(controls[1], 'refresh');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    activeControls().forEach((control) => {
      expect(control.props.refreshing).toBe(true);
      expect(control.props.progressViewOffset).toBe(0);
    });
    view.rerender(<Workspace columns={false} />);
    expect(screen.UNSAFE_getAllByType(RefreshControl)).toHaveLength(1);
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(true);
    fireEvent(screen.UNSAFE_getByType(RefreshControl), 'refresh');
    expect(onRefresh).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(screen.UNSAFE_getByType(RefreshControl).props.refreshing).toBe(
      false,
    );
  });
});
