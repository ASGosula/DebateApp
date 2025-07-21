import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const PREP_TIME_SECONDS = 8 * 60; // Policy prep is often 8-10 min, but you can adjust
const { width } = Dimensions.get('window');

const debateSections = [
  { label: "1AC (Aff #1 reads)", duration: 8 * 60 },
  { label: "Cross X (Neg #2 asks)", duration: 3 * 60 },
  { label: "1NC (Neg #1 reads)", duration: 8 * 60 },
  { label: "Cross X (Aff #1 asks)", duration: 3 * 60 },
  { label: "2AC (Aff #2 reads)", duration: 8 * 60 },
  { label: "Cross X (Neg #1 reads)", duration: 3 * 60 },
  { label: "2NC (Neg #2 reads)", duration: 8 * 60 },
  { label: "Cross X (Aff #2 asks)", duration: 3 * 60 },
  { label: "1NR (Neg #1 reads)", duration: 5 * 60 },
  { label: "1AR (Aff #1 reads)", duration: 5 * 60 },
  { label: "2NR (Neg #2 reads)", duration: 5 * 60 },
  { label: "2AR (Aff #2 reads)", duration: 5 * 60 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PolicyReal() {
  // Prep timer state
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME_SECONDS);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const prepIntervalRef = useRef<any>(null);

  // Debate timer state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [debateTimeLeft, setDebateTimeLeft] = useState(debateSections[0].duration);
  const [isDebateRunning, setIsDebateRunning] = useState(false);
  const debateIntervalRef = useRef<any>(null);

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

  // Debate timer logic
  React.useEffect(() => {
    if (isDebateRunning && debateTimeLeft > 0) {
      debateIntervalRef.current = setInterval(() => {
        setDebateTimeLeft((prev) => {
          if (prev <= 1) {
            // Auto-advance to next section
            if (currentSectionIndex < debateSections.length - 1) {
              setCurrentSectionIndex(currentSectionIndex + 1);
              return debateSections[currentSectionIndex + 1].duration;
            } else {
              // End of debate
              setIsDebateRunning(false);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else if (!isDebateRunning && debateIntervalRef.current) {
      clearInterval(debateIntervalRef.current);
      debateIntervalRef.current = null;
    }
    return () => {
      if (debateIntervalRef.current) clearInterval(debateIntervalRef.current);
    };
  }, [isDebateRunning, debateTimeLeft, currentSectionIndex]);

  // Update debate time when section changes
  React.useEffect(() => {
    setDebateTimeLeft(debateSections[currentSectionIndex].duration);
  }, [currentSectionIndex]);

  const handlePrepReset = () => {
    setPrepTimeLeft(PREP_TIME_SECONDS);
    setIsPrepRunning(false);
  };

  const handleDebateStart = () => {
    setIsDebateRunning(true);
  };

  const handleDebateStop = () => {
    setIsDebateRunning(false);
  };

  const handleDebateReset = () => {
    setDebateTimeLeft(debateSections[currentSectionIndex].duration);
    setIsDebateRunning(false);
  };

  const handleDebateResetAll = () => {
    setPrepTimeLeft(PREP_TIME_SECONDS);
    setIsPrepRunning(false);
    setCurrentSectionIndex(0);
    setDebateTimeLeft(debateSections[0].duration);
    setIsDebateRunning(false);
  };

  return (
    <View style={styles.container}>
      {/* Swipe to go back indicator */}
      <View style={styles.swipeIndicator}>
        <ThemedText style={styles.swipeText}>← Swipe to go back</ThemedText>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title" style={styles.headerTitle}>Policy</ThemedText>
        <ThemedText type="subtitle" style={styles.headerSubtitle}>Real Debate</ThemedText>
      </View>

      {/* Prep Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.prepLabel}>Prep Time</ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.timerTextRed}>{formatTime(prepTimeLeft)}</ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isPrepRunning && styles.activeButton]} 
            onPress={() => setIsPrepRunning(true)}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isPrepRunning && styles.activeButton]} 
            onPress={() => setIsPrepRunning(false)}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handlePrepReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Debate Timer Card */}
      <View style={styles.timerCard}>
        <View style={styles.cardHeader}>
          <ThemedText type="subtitle" style={styles.debateLabel}>
            {debateSections[currentSectionIndex].label}
          </ThemedText>
          <ThemedText type="default" style={styles.sectionInfo}>
            Section {currentSectionIndex + 1} of {debateSections.length}
          </ThemedText>
        </View>
        <View style={styles.timerDisplay}>
          <ThemedText type="title" style={styles.debateTimerText}>
            {formatTime(debateTimeLeft)}
          </ThemedText>
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.controlButton, isDebateRunning && styles.activeButton]} 
            onPress={handleDebateStart}
          >
            <ThemedText style={styles.controlButtonText}>Start</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, !isDebateRunning && styles.activeButton]} 
            onPress={handleDebateStop}
          >
            <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resetButton} onPress={handleDebateReset}>
            <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.controlButton, currentSectionIndex === debateSections.length - 1 && { opacity: 0.5 }]} 
            onPress={() => {
              if (currentSectionIndex < debateSections.length - 1) {
                setCurrentSectionIndex(currentSectionIndex + 1);
              }
            }}
            disabled={currentSectionIndex === debateSections.length - 1}
          >
            <ThemedText style={styles.controlButtonText}>Skip</ThemedText>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.resetAllButton} onPress={handleDebateResetAll}>
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
    paddingHorizontal: 10, // reduced from 16
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 2, // reduced from 3
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
    fontSize: 13, // reduced from 14
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resetButton: {
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 10, // reduced from 16
    borderRadius: 10,
    flex: 1,
    marginHorizontal: 2, // reduced from 3
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 13, // reduced from 14
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