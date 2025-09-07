import React, { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';

export default function SuccessOverlay({
  visible,
  title = 'Saved!',
  subtitle,
  durationMs = 1200,
  onHide,
}: {
  visible: boolean;
  title?: string;
  subtitle?: string;
  durationMs?: number;
  onHide?: () => void;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      opacity.setValue(0);
      scale.setValue(0.8);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      ]).start(() => {
        setTimeout(() => {
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
            onHide?.();
          });
        }, durationMs);
      });
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => onHide?.()}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.emoji}>✅</Text>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#ffffff', paddingVertical: 20, paddingHorizontal: 24, borderRadius: 16, alignItems: 'center', minWidth: 200 },
  emoji: { fontSize: 36, marginBottom: 6 },
  title: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 14, color: '#555', marginTop: 4 },
});
