import React from 'react';
import { RefreshControl, Text } from 'react-native';
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

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));

// Run the component's scroll worklets synchronously for interaction tests.
// Device rendering and native pull activation are outside this mock's scope.
let updateHeading: (() => void) | undefined;

describe('ScrollingScreen', () => {
  beforeEach(() => {
    updateHeading = undefined;
    const makeSharedValue = Reanimated.useSharedValue;
    jest
      .spyOn(Reanimated, 'useSharedValue')
      .mockImplementation(
        (value) => React.useRef(makeSharedValue(value)).current,
      );
    jest.spyOn(Reanimated, 'useDerivedValue').mockImplementation(
      (updater) =>
        ({
          get value() {
            return updater();
          },
        }) as ReturnType<typeof Reanimated.useDerivedValue>,
    );
    jest
      .spyOn(Reanimated, 'useAnimatedReaction')
      .mockImplementation((prepare, react) => {
        const previous = React.useRef<ReturnType<typeof prepare> | null>(null);
        updateHeading = () => {
          const next = prepare();
          react(next, previous.current);
          previous.current = next;
        };
      });
    jest.spyOn(Reanimated, 'useAnimatedScrollHandler').mockImplementation(
      (handler) =>
        ((event: { nativeEvent: Parameters<Reanimated.ScrollHandler>[0] }) => {
          if (typeof handler === 'function') handler(event.nativeEvent, {});
          updateHeading?.();
        }) as unknown as ReturnType<typeof Reanimated.useAnimatedScrollHandler>,
    );
  });

  afterEach(() => jest.restoreAllMocks());

  const renderScreen = (
    props: Partial<React.ComponentProps<typeof ScrollingScreen>> = {},
  ) =>
    render(
      <ScrollingScreen
        theme={defaultTheme}
        title="Weather Forecast"
        compactTitle="Forecast"
        {...props}
      >
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
    expect(scroll.props.contentContainerStyle).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ paddingTop: 59, paddingBottom: 58 }),
      ]),
    );
    expect(screen.getAllByRole('header')).toHaveLength(1);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
  });

  it('waits until the expanded heading scrolls out of view before revealing the compact title', () => {
    renderScreen();
    fireEvent(screen.getByTestId('screen-expanded-header'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 59, width: 300, height: 100 } },
    });
    scrollTo(40);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
    expect(
      screen.getByTestId('screen-compact-header', {
        includeHiddenElements: true,
      }),
    ).toHaveStyle({ opacity: 0 });
    scrollTo(111);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
    expect(
      screen.getByTestId('screen-compact-header', {
        includeHiddenElements: true,
      }),
    ).toHaveStyle({ opacity: 0 });
    scrollTo(136);
    expect(screen.getByRole('header')).toHaveTextContent('Forecast');
    expect(screen.getByTestId('screen-compact-header')).toHaveStyle({
      opacity: 0.5,
    });
    scrollTo(80);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
    expect(
      screen.getByTestId('screen-compact-header', {
        includeHiddenElements: true,
      }),
    ).toHaveStyle({ opacity: 0 });
    scrollTo(160);
    expect(screen.getAllByRole('header')).toHaveLength(1);
    expect(screen.getByRole('header')).toHaveTextContent('Forecast');
    expect(screen.getByTestId('screen-compact-header')).toHaveStyle({
      opacity: 1,
    });
    scrollTo(-80);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
    expect(
      screen.getByTestId('screen-compact-header', {
        includeHiddenElements: true,
      }),
    ).toHaveStyle({ opacity: 0 });
  });

  it('keeps the back action available after the title collapses', () => {
    const onBack = jest.fn();
    renderScreen({ onBack });
    scrollTo(200);
    fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('keeps Settings available after the title collapses', () => {
    renderScreen({ showSettings: true });
    scrollTo(200);
    fireEvent.press(screen.getByRole('button', { name: 'Open settings' }));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('fully reveals the compact title at the end of a short page', () => {
    renderScreen();
    const scroll = screen.getByTestId('screen-scroll');
    fireEvent(scroll, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 800 } },
    });
    fireEvent(scroll, 'contentSizeChange', 300, 932);
    fireEvent(screen.getByTestId('screen-expanded-header'), 'layout', {
      nativeEvent: { layout: { x: 0, y: 59, width: 300, height: 100 } },
    });
    scrollTo(111);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
    scrollTo(132);
    expect(screen.getByRole('header')).toHaveTextContent('Forecast');
    expect(screen.getByTestId('screen-compact-header')).toHaveStyle({
      opacity: 1,
      transform: [{ translateY: 0 }],
    });
  });

  it('does not show a manual refresh indicator for background loading', () => {
    const onRefresh = jest.fn();
    renderScreen({ onRefresh, refreshBusy: true });
    const control = screen.UNSAFE_getByType(RefreshControl);
    expect(control.props.refreshing).toBe(false);
    expect(control.props.progressViewOffset).toBeGreaterThanOrEqual(95);
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

  it('removes title movement when reduced motion is enabled', () => {
    jest.mocked(Reanimated.useReducedMotion).mockReturnValue(true);
    renderScreen();
    scrollTo(200);
    expect(screen.getByTestId('screen-compact-header')).toHaveStyle({
      opacity: 1,
      transform: [{ translateY: 0 }],
    });
    scrollTo(0);
    expect(screen.getByRole('header')).toHaveTextContent('Weather Forecast');
  });
});
