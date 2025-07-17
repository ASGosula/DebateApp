import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SPEECH_TIME = 180; // 3 minutes in seconds
const PREP_TIME = 180; // 3 minutes in seconds

export default function CongressReal() {
  const [speechTime, setSpeechTime] = useState(SPEECH_TIME);
  const [prepTime, setPrepTime] = useState(PREP_TIME);
  const [isSpeechRunning, setIsSpeechRunning] = useState(false);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const speechInterval = useRef<NodeJS.Timeout | null>(null);
  const prepInterval = useRef<NodeJS.Timeout | null>(null);

  const startSpeech = () => {
    if (isSpeechRunning) return;
    setIsSpeechRunning(true);
    speechInterval.current = setInterval(() => {
      setSpeechTime((prev) => {
        if (prev <= 1) {
          clearInterval(speechInterval.current!);
          setIsSpeechRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pauseSpeech = () => {
    setIsSpeechRunning(false);
    if (speechInterval.current) clearInterval(speechInterval.current);
  };

  const resetSpeech = () => {
    pauseSpeech();
    setSpeechTime(SPEECH_TIME);
  };

  const startPrep = () => {
    if (isPrepRunning) return;
    setIsPrepRunning(true);
    prepInterval.current = setInterval(() => {
      setPrepTime((prev) => {
        if (prev <= 1) {
          clearInterval(prepInterval.current!);
          setIsPrepRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pausePrep = () => {
    setIsPrepRunning(false);
    if (prepInterval.current) clearInterval(prepInterval.current);
  };

  const resetPrep = () => {
    pausePrep();
    setPrepTime(PREP_TIME);
  };

  React.useEffect(() => {
    return () => {
      if (speechInterval.current) clearInterval(speechInterval.current);
      if (prepInterval.current) clearInterval(prepInterval.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(1, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.swipeIndicator}>
        <Text style={styles.swipeText}>← Swipe to go back</Text>
      </View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Congress</Text>
        <Text style={styles.headerSubtitle}>Real Debate</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Speech Timer</Text>
        <Text style={styles.timer}>{formatTime(speechTime)}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.startButton} onPress={startSpeech}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopButton} onPress={pauseSpeech}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetSpeech}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.resetAllButton} onPress={() => {
          pauseSpeech();
          pausePrep();
          setSpeechTime(SPEECH_TIME);
          setPrepTime(PREP_TIME);
        }}>
          <Text style={styles.resetAllButtonText}>Reset All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.title}>Prep Timer</Text>
        <Text style={styles.timer}>{formatTime(prepTime)}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.startButton} onPress={startPrep}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.stopButton} onPress={pausePrep}>
            <Text style={styles.buttonText}>Stop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={resetPrep}>
            <Text style={styles.buttonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeIndicator: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 8,
  },
  swipeText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: 320,
    maxWidth: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  stopButton: {
    backgroundColor: '#b30000',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  resetButton: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 0,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  button: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetAllButton: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#E20000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  resetAllButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
}); 