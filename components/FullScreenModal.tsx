import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import type { WeatherTheme } from '../utils/weatherTheme';

interface FullScreenModalProps {
  visible: boolean;
  onClose: () => void;
  closeLabel: string;
  theme: WeatherTheme;
  children: React.ReactNode;
}

export function FullScreenModal({
  visible,
  onClose,
  closeLabel,
  theme,
  children,
}: FullScreenModalProps) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider
        style={[styles.fill, { backgroundColor: theme.background }]}
      >
        <SafeAreaView style={styles.fill}>
          <View style={styles.fill}>
            {children}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeLabel}
              onPress={onClose}
              style={[styles.close, { backgroundColor: theme.surface }]}
            >
              <X size={24} color={theme.text} />
            </Pressable>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  close: {
    position: 'absolute',
    top: 8,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
