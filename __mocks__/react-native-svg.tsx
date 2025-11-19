import React from 'react';
import { View, Text as RNText } from 'react-native';

// Mock function to create a generic SVG component
const createMockComponent = (name: string) => {
  const MockComponent = (props: any) => {
    const { children, ...otherProps } = props;
    // The testID is preserved to allow querying
    return <View {...otherProps}>{children}</View>;
  };
  MockComponent.displayName = name;
  return MockComponent;
};

// Mock for the main Svg container
export const Svg = (props: any) => <View {...props}>{props.children}</View>;

// Mock for Svg.Text to render children as RNText
export const Text = (props: any) => {
  const { children, ...otherProps } = props;
  return <RNText {...otherProps}>{children}</RNText>;
};

// Mocks for other common SVG components
export const Path = createMockComponent('Path');
export const Line = createMockComponent('Line');
export const Circle = createMockComponent('Circle');
export const Rect = createMockComponent('Rect');
export const Defs = createMockComponent('Defs');
export const LinearGradient = createMockComponent('LinearGradient');
export const Stop = createMockComponent('Stop');
export const G = createMockComponent('G'); // Often used for grouping

// Default export
export default Svg;
