import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const QUESTIONING_BLOCK_SECONDS = 30; // 30 seconds
const SPEECH_TIME_SECONDS = 3 * 60; // 3 minutes
const { width } = Dimensions.get('window');

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CongressReal() {
  // Questioning Block timer
  const [questioningLeft, setQuestioningLeft] = useState(QUESTIONING_BLOCK_SECONDS);
  const [isQuestioningRunning, setIsQuestioningRunning] = useState(false);
  const questioningIntervalRef = useRef<any>(null);

  // Speech timer
  const [speechLeft, setSpeechLeft] = useState(SPEECH_TIME_SECONDS);
  const [isSpeechRunning, setIsSpeechRunning] = useState(false);
  const speechIntervalRef = useRef<any>(null);

  // Questioning Block timer logic
  React.useEffect(() => {
    if (isQuestioningRunning && questioningLeft > 0) {
      questioningIntervalRef.current = setInterval(() => {
        setQuestioningLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isQuestioningRunning && questioningIntervalRef.current) {
      clearInterval(questioningIntervalRef.current);
      questioningIntervalRef.current = null;
    }
    return () => {
      if (questioningIntervalRef.current) clearInterval(questioningIntervalRef.current);
    };
  }, [isQuestioningRunning, questioningLeft]);

  // Speech timer logic
  React.useEffect(() => {
    if (isSpeechRunning && speechLeft > 0) {
      speechIntervalRef.current = setInterval(() => {
        setSpeechLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isSpeechRunning && speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    return () => {
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };
  }, [isSpeechRunning, speechLeft]);

  // Handlers
  const handleQuestioningReset = () => {
    setQuestioningLeft(QUESTIONING_BLOCK_SECONDS);
    setIsQuestioningRunning(false);
  };
  const handleSpeechReset = () => {
    setSpeechLeft(SPEECH_TIME_SECONDS);
    setIsSpeechRunning(false);
  };
  const handleResetAll = () => {
    setQuestioningLeft(QUESTIONING_BLOCK_SECONDS);
    setIsQuestioningRunning(false);
    setSpeechLeft(SPEECH_TIME_SECONDS);
    setIsSpeechRunning(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Congress</ThemedText>
        <ThemedText type="subtitle" style={styles.headerSubtitle}>Real Debate</ThemedText>
      </View>

      {/* Questioning Block Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.prepLabel}>Questioning Block</ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.timerTextRed}>{formatTime(questioningLeft)}</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isQuestioningRunning && styles.activeButton]} 
            onPress={() => setIsQuestioningRunning(true)}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isQuestioningRunning && styles.activeButton]} 
            onPress={() => setIsQuestioningRunning(false)}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleQuestioningReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Speech Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.debateLabel}>Speech Time</ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.debateTimerText}>{formatTime(speechLeft)}</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isSpeechRunning && styles.activeButton]} 
            onPress={() => setIsSpeechRunning(true)}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isSpeechRunning && styles.activeButton]} 
            onPress={() => setIsSpeechRunning(false)}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleSpeechReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.resetAllButton} onPress={handleResetAll}>
          <ThemedText style={styles.resetButtonText}>Reset All</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  timerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  prepLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  debateLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  timerTextRed: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E20000',
    textAlign: 'center',
  },
  debateTimerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E20000',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlButton: {
    backgroundColor: '#E20000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    shadowColor: '#E20000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  activeButton: {
    backgroundColor: '#b30000',
    transform: [{ scale: 0.98 }],
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resetButton: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resetAllButton: {
    backgroundColor: '#E20000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#E20000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
}); 