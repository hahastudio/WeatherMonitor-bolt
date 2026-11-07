import React, { useCallback, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useReducedTransparency } from './GlassSurface';
import { ScrollEdgeFade } from './ScrollEdgeFade';

/** Fade only the edges that have more content, without intercepting swipes. */
export function FadingHorizontalScroll({
  children,
  contentContainerStyle,
  testID = 'fading-horizontal',
}: React.PropsWithChildren<{
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}>) {
  const reducedTransparency = useReducedTransparency();
  const fadeInset = reducedTransparency ? 0 : 16;
  const metrics = useRef({ offset: 0, viewport: 0, content: 0 });
  const [edges, setEdges] = useState({ start: false, end: false });
  const updateEdges = useCallback(() => {
    const { offset, viewport, content } = metrics.current;
    const overflow = viewport > 0 && content > viewport + 1;
    const start = overflow && offset > 1;
    const end = overflow && offset + viewport < content - 1;
    setEdges((previous) =>
      previous.start === start && previous.end === end
        ? previous
        : { start, end },
    );
  }, []);
  const trackScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    metrics.current = {
      offset: Math.max(0, contentOffset.x),
      viewport: layoutMeasurement.width,
      content: contentSize.width,
    };
    updateEdges();
  };
  const start = edges.start ? fadeInset : 0;
  const end = edges.end ? fadeInset : 0;
  return (
    <ScrollEdgeFade
      testID={`${testID}-frame`}
      horizontal
      inset={fadeInset}
      start={start}
      end={end}
      style={styles.container}
    >
      <ScrollView
        testID={`${testID}-scroll`}
        horizontal
        showsHorizontalScrollIndicator={false}
        fadingEdgeLength={{ start, end }}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
        contentContainerStyle={contentContainerStyle}
        scrollEventThrottle={16}
        onLayout={(event) => {
          metrics.current.viewport = event.nativeEvent.layout.width;
          updateEdges();
        }}
        onContentSizeChange={(width) => {
          metrics.current.content = width;
          updateEdges();
        }}
        onScroll={trackScroll}
        onMomentumScrollEnd={trackScroll}
        onScrollEndDrag={trackScroll}
      >
        {children}
      </ScrollView>
    </ScrollEdgeFade>
  );
}

const styles = StyleSheet.create({
  container: { minWidth: 0 },
});
