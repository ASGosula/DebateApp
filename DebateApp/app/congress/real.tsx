import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const SPEECH_TIME = 3 * 60; // 3 minutes
const PREP_TIME = 3 * 60; // 3 minutes
const QUESTION_TIME = 30; // 30 seconds
const { width } = Dimensions.get('window');

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function CongressReal() {
  // Speech timer state
  const [speechTimeLeft, setSpeechTimeLeft] = useState(SPEECH_TIME);
  const [isSpeechRunning, setIsSpeechRunning] = useState(false);
  const speechIntervalRef = useRef<any>(null);

  // Prep timer state
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const prepIntervalRef = useRef<any>(null);

  // Questioning timer state
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME);
  const [isQuestionRunning, setIsQuestionRunning] = useState(false);
  const questionIntervalRef = useRef<any>(null);

  // Speech timer logic
  React.useEffect(() => {
    if (isSpeechRunning && speechTimeLeft > 0) {
      speechIntervalRef.current = setInterval(() => {
        setSpeechTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isSpeechRunning && speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    return () => {
      if (speechIntervalRef.current) clearInterval(speechIntervalRef.current);
    };
  }, [isSpeechRunning, speechTimeLeft]);

  // Prep timer logic
  React.useEffect(() => {
    if (isPrepRunning && prepTimeLeft > 0) {
      prepIntervalRef.current = setInterval(() => {
        setPrepTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isPrepRunning && prepIntervalRef.current) {
      clearInterval(prepIntervalRef.current);
      prepIntervalRef.current = null;
    }
    return () => {
      if (prepIntervalRef.current) clearInterval(prepIntervalRef.current);
    };
  }, [isPrepRunning, prepTimeLeft]);

  // Questioning timer logic
  React.useEffect(() => {
    if (isQuestionRunning && questionTimeLeft > 0) {
      questionIntervalRef.current = setInterval(() => {
        setQuestionTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    } else if (!isQuestionRunning && questionIntervalRef.current) {
      clearInterval(questionIntervalRef.current);
      questionIntervalRef.current = null;
    }
    return () => {
      if (questionIntervalRef.current) clearInterval(questionIntervalRef.current);
    };
  }, [isQuestionRunning, questionTimeLeft]);

  const handleSpeechStart = () => setIsSpeechRunning(true);
  const handleSpeechStop = () => setIsSpeechRunning(false);
  const handleSpeechReset = () => {
    setSpeechTimeLeft(SPEECH_TIME);
    setIsSpeechRunning(false);
  };

  const handlePrepStart = () => setIsPrepRunning(true);
  const handlePrepStop = () => setIsPrepRunning(false);
  const handlePrepReset = () => {
    setPrepTimeLeft(PREP_TIME);
    setIsPrepRunning(false);
  };

  const handleQuestionStart = () => setIsQuestionRunning(true);
  const handleQuestionStop = () => setIsQuestionRunning(false);
  const handleQuestionReset = () => {
    setQuestionTimeLeft(QUESTION_TIME);
    setIsQuestionRunning(false);
  };

  const handleResetAll = () => {
    setSpeechTimeLeft(SPEECH_TIME);
    setIsSpeechRunning(false);
    setPrepTimeLeft(PREP_TIME);
    setIsPrepRunning(false);
    setQuestionTimeLeft(QUESTION_TIME);
    setIsQuestionRunning(false);
  };

  return (
    <View style={styles.container}>
      {/* Swipe to go back indicator */}
      <View style={styles.swipeIndicator}>
        <ThemedText style={styles.swipeText}>← Swipe to go back</ThemedText>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Congress</ThemedText>
        <ThemedText type="subtitle" style={styles.headerSubtitle}>Real Debate</ThemedText>
      </View>

      {/* Speech Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.debateLabel}>Speech Timer</ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.debateTimerText}>{formatTime(speechTimeLeft)}</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isSpeechRunning && styles.activeButton]} 
            onPress={handleSpeechStart}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isSpeechRunning && styles.activeButton]} 
            onPress={handleSpeechStop}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleSpeechReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Prep Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.prepLabel}>Prep Timer</ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.timerTextRed}>{formatTime(prepTimeLeft)}</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isPrepRunning && styles.activeButton]} 
            onPress={handlePrepStart}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isPrepRunning && styles.activeButton]} 
            onPress={handlePrepStop}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handlePrepReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Questioning Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.debateLabel}>Questioning Timer</ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.timerTextRed}>{formatTime(questionTimeLeft)}</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isQuestionRunning && styles.activeButton]} 
            onPress={handleQuestionStart}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isQuestionRunning && styles.activeButton]} 
            onPress={handleQuestionStop}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleQuestionReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.resetAllButton} onPress={handleResetAll}>
        <ThemedText style={styles.resetButtonText}>Reset All</ThemedText>
      </TouchableOpacity>
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
  sectionInfo: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E20000',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  controlButton: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    shadowColor: '#E20000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  activeButton: {
    backgroundColor: '#b30000',
    transform: [{ scale: 0.98 }],
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resetButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
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
  },
}); 