import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

/** An alpha mask reveals the actual backdrop instead of painting over it. */
export function ScrollEdgeFade({
  start,
  end,
  inset,
  horizontal = false,
  children,
  style,
  ...props
}: ViewProps & {
  start: number;
  end: number;
  inset: number;
  horizontal?: boolean;
}) {
  // Extend into the surrounding gutters, preserving the original content area.
  const frame = [
    styles.frame,
    horizontal
      ? { marginHorizontal: -inset }
      : inset > 0 && {
          position: 'absolute' as const,
          top: -inset,
          bottom: -inset,
          left: 0,
          right: 0,
        },
  ];
  const mask =
    start || end
      ? `linear-gradient(to ${horizontal ? 'right' : 'bottom'}, ${start ? 'transparent' : '#000'} 0, #000 ${start}px, #000 calc(100% - ${end}px), ${end ? 'transparent' : '#000'} 100%)`
      : 'none';

  return (
    <View {...props} style={style}>
      {Platform.OS === 'ios' ? (
        <MaskedView
          style={frame}
          maskElement={
            <View
              style={[
                styles.mask,
                { flexDirection: horizontal ? 'row' : 'column' },
              ]}
            >
              <LinearGradient
                colors={['#00000000', '#000000']}
                start={{ x: 0, y: 0 }}
                end={horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 }}
                style={horizontal ? { width: start } : { height: start }}
              />
              <View style={styles.opaque} />
              <LinearGradient
                colors={['#000000', '#00000000']}
                start={{ x: 0, y: 0 }}
                end={horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 }}
                style={horizontal ? { width: end } : { height: end }}
              />
            </View>
          }
        >
          {children}
        </MaskedView>
      ) : (
        // ScrollViews use Android's native fadingEdgeLength; web uses an alpha mask.
        <View
          style={[
            frame,
            Platform.OS === 'web' &&
              ({ maskImage: mask, WebkitMaskImage: mask } as ViewStyle),
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flexGrow: 1, minHeight: 0, minWidth: 0 },
  mask: { flex: 1 },
  opaque: { flex: 1, backgroundColor: '#000000' },
});
