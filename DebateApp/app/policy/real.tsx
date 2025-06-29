import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';

const PREP_TIME_SECONDS = 8 * 60; // Policy prep time is often 8 minutes per team, but adjust if needed
const { width } = Dimensions.get('window');

const debateSections = [
  { label: '1AC – 8 minutes (partner #1 on the affirmative reads)', duration: 8 * 60 },
  { label: 'Cross-Examination – 3 minutes (partner #2 on the negative asks)', duration: 3 * 60 },
  { label: '1NC – 8 minutes (partner #1 on the negative reads)', duration: 8 * 60 },
  { label: 'Cross-Examination – 3 minutes (partner #1 on the affirmative asks)', duration: 3 * 60 },
  { label: '2AC – 8 minutes (partner #2 on the affirmative reads)', duration: 8 * 60 },
  { label: 'Cross-Examination – 3 minutes (partner #1 on the negative asks)', duration: 3 * 60 },
  { label: '2NC – 8 minutes (partner #2 on the negative reads)', duration: 8 * 60 },
  { label: 'Cross-Examination – 3 minutes (partner #2 on the affirmative asks)', duration: 3 * 60 },
  { label: '1NR – 5 minutes (partner #1 on the negative reads)', duration: 5 * 60 },
  { label: '1AR – 5 minutes (partner #1 on the affirmative reads)', duration: 5 * 60 },
  { label: '2NR – 5 minutes (partner #2 on the negative reads)', duration: 5 * 60 },
  { label: '2AR – 5 minutes (partner #2 on the affirmative reads)', duration: 5 * 60 },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function PolicyRealDebate() {
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
            if (currentSectionIndex < debateSections.length - 1) {
              setCurrentSectionIndex(currentSectionIndex + 1);
              return debateSections[currentSectionIndex + 1].duration;
            } else {
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
    // Reset prep timer
    setPrepTimeLeft(PREP_TIME_SECONDS);
    setIsPrepRunning(false);
    // Reset debate timer
    setCurrentSectionIndex(0);
    setDebateTimeLeft(debateSections[0].duration);
    setIsDebateRunning(false);
  };

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
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
              <TouchableOpacity style={styles.skipButton} onPress={() => setPrepTimeLeft((prev) => Math.max(0, prev - 10))}>
                <ThemedText style={styles.skipButtonText}>-10s</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Debate Timer Card */}
          <View style={styles.timerCard}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle" style={styles.debateLabel} numberOfLines={3}>
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
              <TouchableOpacity style={styles.skipButton} onPress={() => setDebateTimeLeft((prev) => Math.max(prev - 10, 0))}>
                <ThemedText style={styles.skipButtonText}>-10s</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.resetAllButton} onPress={handleDebateResetAll}>
              <ThemedText style={styles.resetButtonText}>Reset All</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    paddingBottom: 32,
  },
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
    flexWrap: 'wrap',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 60,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 60,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 12,
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
  skipButton: {
    backgroundColor: '#000000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 60,
  },
  skipButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
}); 