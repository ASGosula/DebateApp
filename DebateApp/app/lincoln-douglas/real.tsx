import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const PREP_TIME_SECONDS = 4 * 60; // 4 minutes

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function LincolnDouglasReal() {
  const [timeLeft, setTimeLeft] = useState(PREP_TIME_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<any>(null);

  React.useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleReset = () => {
    setTimeLeft(PREP_TIME_SECONDS);
    setIsRunning(false);
  };

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle" style={styles.prepLabel}>Prep</ThemedText>
      <ThemedText type="title" style={styles.timerTextRed}>{formatTime(timeLeft)}</ThemedText>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.controlButton} onPress={() => setIsRunning(true)}>
          <ThemedText style={styles.controlButtonText}>Start</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={() => setIsRunning(false)}>
          <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
          <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  prepLabel: {
    marginBottom: 8,
    letterSpacing: 1,
    color: '#E20000', // theme tint
  },
  timerTextRed: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 20,
    textAlign: 'center',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  controlButton: {
    backgroundColor: '#E20000', // theme tint
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  resetButton: {
    backgroundColor: '#000000', // black for reset
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
}); 