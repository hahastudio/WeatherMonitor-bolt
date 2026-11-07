import React from 'react';
import { Platform, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FadingHorizontalScroll } from '../../components/FadingHorizontalScroll';

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: require('react-native').View,
}));

afterEach(() => jest.restoreAllMocks());

it('turns Android fades off at each scroll limit and when the window widens', () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  render(
    <FadingHorizontalScroll>
      <Text>Map layers</Text>
    </FadingHorizontalScroll>,
  );
  const scroll = screen.getByTestId('fading-horizontal-scroll');
  const fades = () => scroll.props.fadingEdgeLength;
  const layout = (width: number) =>
    fireEvent(scroll, 'layout', { nativeEvent: { layout: { width } } });
  const move = (x: number, event = 'scroll', viewport = 320, content = 600) =>
    fireEvent(scroll, event, {
      nativeEvent: {
        contentOffset: { x, y: 0 },
        layoutMeasurement: { width: viewport, height: 44 },
        contentSize: { width: content, height: 44 },
      },
    });
  layout(320);
  fireEvent(scroll, 'contentSizeChange', 600, 44);
  expect(fades()).toEqual({ start: 0, end: 16 });
  move(100);
  expect(fades()).toEqual({ start: 16, end: 16 });
  move(280);
  expect(fades()).toEqual({ start: 16, end: 0 });
  move(0, 'scrollEndDrag');
  expect(fades()).toEqual({ start: 0, end: 16 });
  // A final Android momentum event carries fresh dimensions after resizing.
  move(0, 'momentumScrollEnd', 720, 600);
  expect(fades()).toEqual({ start: 0, end: 0 });
  layout(720);
  expect(fades()).toEqual({ start: 0, end: 0 });
});
