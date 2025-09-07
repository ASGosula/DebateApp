import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, Text, FlatList, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Link } from 'expo-router';
import ScoreRubricModal, { RubricItem } from '../../components/ScoreRubricModal';
import { auth, db } from '../../constants/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import SuccessOverlay from '../../components/SuccessOverlay';

const PREP_TIME_SECONDS = 3 * 60; // 3 minutes
const { width } = Dimensions.get('window');

const debateSections = [
  { label: '1AC', duration: 4 * 60 },
  { label: '1NC', duration: 4 * 60 },
  { label: '1st Crossfire', duration: 3 * 60 },
  { label: '1AR', duration: 4 * 60 },
  { label: '1NR', duration: 4 * 60 },
  { label: '2nd Crossfire', duration: 3 * 60 },
  { label: '2AR', duration: 2 * 60 },
  { label: '2NR', duration: 2 * 60 },
  { label: 'Grand Crossfire', duration: 3 * 60 },
  { label: '1FF', duration: 2 * 60 },
  { label: '2FF', duration: 2 * 60 },
];

const RUBRIC: RubricItem[] = [
  { key: 'clarity', label: 'Clarity', max: 20 },
  { key: 'organization', label: 'Organization', max: 20 },
  { key: 'evidence', label: 'Evidence/Support', max: 20 },
  { key: 'delivery', label: 'Delivery/Presence', max: 20 },
  { key: 'time', label: 'Time Management', max: 20 },
];

const ENCOURAGEMENTS = [
  'Great job! Keep practicing!',
  'Remember to breathe and pace yourself.',
  'Confidence comes with practice!',
  'Try to make eye contact with your audience.',
  'Strong arguments are clear and concise.'
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(1, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function calculateDecibels(amplitude: number): number {
  const minAmplitude = 0.0001;
  const maxAmplitude = 1.0;
  if (amplitude <= minAmplitude) return 0;
  const db = 20 * Math.log10(amplitude / minAmplitude);
  return Math.max(30, Math.min(80, db + 40));
}

export default function PublicForumPractice() {
  // Prep timer state
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME_SECONDS);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const prepIntervalRef = useRef<any>(null);

  // Debate timer state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [debateTimeLeft, setDebateTimeLeft] = useState(debateSections[0].duration);
  const [isDebateRunning, setIsDebateRunning] = useState(false);
  const debateIntervalRef = useRef<any>(null);

  // Sound meter state
  const [isRecording, setIsRecording] = useState(false);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState('Not Recording');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundMeterIntervalRef = useRef<any>(null);

  // Self-review state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackObj, setPlaybackObj] = useState<Audio.Sound | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [rubricVisible, setRubricVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  // Prep timer logic
  useEffect(() => {
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
  useEffect(() => {
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

  useEffect(() => {
    setDebateTimeLeft(debateSections[currentSectionIndex].duration);
  }, [currentSectionIndex]);

  useEffect(() => {
    if (isRecording) {
      soundMeterIntervalRef.current = setInterval(async () => {
        try {
          if (recordingRef.current) {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording) {
              const uri = recordingRef.current.getURI();
              if (uri) {
                const baseAmplitude = 0.1;
                const noiseLevel = Math.random() * 0.3;
                const voiceAmplitude = Math.random() * 0.4;
                const amplitude = baseAmplitude + noiseLevel + voiceAmplitude;
                const db = calculateDecibels(amplitude);
                setDecibelLevel(db);
                if (db >= 65 && db <= 75) {
                  setVoiceStatus('Good Volume');
                } else if (db < 65) {
                  setVoiceStatus('Too Low');
                } else {
                  setVoiceStatus('Too High');
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading sound level:', error);
        }
      }, 200);
    } else {
      if (soundMeterIntervalRef.current) {
        clearInterval(soundMeterIntervalRef.current);
        soundMeterIntervalRef.current = null;
      }
      setDecibelLevel(0);
      setVoiceStatus('Not Recording');
    }
    return () => {
      if (soundMeterIntervalRef.current) clearInterval(soundMeterIntervalRef.current);
    };
  }, [isRecording]);

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

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setRecordedUri(null);
      setShowReview(false);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordedUri(uri);
      setShowReview(true);
      setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
      setRubricVisible(true);
    } catch (err) {
      Alert.alert('Error', 'Could not stop recording.');
    }
  };

  const playRecording = async () => {
    if (!recordedUri) return;
    try {
      if (playbackObj) {
        await playbackObj.unloadAsync();
        setPlaybackObj(null);
      }
      const { sound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setPlaybackObj(sound);
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded || status.didJustFinish) {
          setIsPlaying(false);
        }
      });
      await sound.playAsync();
    } catch (err) {
      Alert.alert('Error', 'Could not play recording.');
    }
  };

  const stopPlayback = async () => {
    if (playbackObj) {
      await playbackObj.stopAsync();
      await playbackObj.unloadAsync();
      setPlaybackObj(null);
      setIsPlaying(false);
    }
  };

  const resetReview = () => {
    setShowReview(false);
    setRecordedUri(null);
    setEncouragement('');
  };

  const submitScores = async ({ breakdown, total }: { breakdown: Record<string, number>; total: number }) => {
    try {
      if (!auth.currentUser) {
        Alert.alert('Not signed in', 'Please sign in to save scores.');
        return;
      }
      setSaving(true);
      const uid = auth.currentUser.uid;
      await addDoc(collection(db, 'userScores'), {
        uid,
        event: 'Public Forum',
        total: Math.min(100, total),
        breakdown,
        createdAt: serverTimestamp(),
      });
      setRubricVisible(false);
      setToastVisible(true);
    } catch (e) {
      Alert.alert('Error', 'Failed to save score.');
    } finally {
      setSaving(false);
    }
  };

  const getVoiceStatusColor = () => {
    switch (voiceStatus) {
      case 'Good Volume':
        return '#4CAF50'; // Green
      case 'Too Low':
        return '#FF9800'; // Orange
      case 'Too High':
        return '#F44336'; // Red
      default:
        return '#666'; // Gray
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Public Forum</ThemedText>
          <ThemedText type="subtitle" style={styles.headerSubtitle}>Practice Debate</ThemedText>
        </View>

        {/* Practice Speaking Button */}
        <View style={{ marginBottom: 16 }}>
          <Link href="/lincoln-douglas/practice-speaking" style={{ backgroundColor: '#E20000', padding: 12, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Practice Speaking</Text>
          </Link>
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

        {/* Sound Meter Card */}
        <View style={styles.timerCard}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle" style={styles.soundMeterLabel}>Voice Level Meter</ThemedText>
          </View>
          <View style={styles.soundMeterDisplay}>
            <ThemedText type="title" style={styles.decibelText}>
              {Math.round(decibelLevel)} dB
            </ThemedText>
            <ThemedText type="default" style={[styles.voiceStatusText, { color: getVoiceStatusColor() }]}> 
              {voiceStatus}
            </ThemedText>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.controlButton, isRecording && styles.activeButton]} 
              onPress={startRecording}
            >
              <ThemedText style={styles.controlButtonText}>Start</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.controlButton, !isRecording && styles.activeButton]} 
              onPress={stopRecording}
            >
              <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
            </TouchableOpacity>
          </View>
          <View style={styles.volumeGuide}>
            <ThemedText type="default" style={styles.guideText}>
              Target: 65-75 dB (Green) | Below 65 dB: Too Low (Orange) | Above 75 dB: Too High (Red)
            </ThemedText>
          </View>
        </View>

        {/* Self-Review Card */}
        <View style={styles.card}>
          {!recording && !recordedUri && (
            <TouchableOpacity style={styles.button} onPress={startRecording}>
              <Text style={styles.buttonText}>Start Recording</Text>
            </TouchableOpacity>
          )}
          {recording && (
            <TouchableOpacity style={[styles.button, styles.stopButton]} onPress={stopRecording}>
              <Text style={styles.buttonText}>Stop Recording</Text>
            </TouchableOpacity>
          )}
          {recordedUri && !recording && (
            <View style={styles.playbackCol}>
              <TouchableOpacity style={styles.button} onPress={isPlaying ? stopPlayback : playRecording}>
                <Text style={styles.buttonText}>{isPlaying ? 'Stop Playback' : 'Play Recording'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetReview}>
                <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button]} onPress={() => setRubricVisible(true)}>
                <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Self Review & Save'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <ScoreRubricModal
          visible={rubricVisible}
          onClose={() => setRubricVisible(false)}
          onSubmit={submitScores}
          rubric={RUBRIC}
          title="Self Review (100 pts)"
          onPlay={playRecording}
          onReset={resetReview}
        />
        <SuccessOverlay visible={toastVisible} title="Saved!" subtitle="Score added to your history" onHide={() => setToastVisible(false)} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingTop: 20,
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
  timerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  prepLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 1,
  },
  debateLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 1,
  },
  soundMeterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 1,
  },
  sectionInfo: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  soundMeterDisplay: {
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  timerTextRed: {
    fontSize: 24,
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
  decibelText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E20000',
    textAlign: 'center',
    marginBottom: 2,
  },
  voiceStatusText: {
    fontSize: 14,
    fontWeight: '600',
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
  volumeGuide: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  guideText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginBottom: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  button: {
    backgroundColor: '#E20000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 6,
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  stopButton: {
    backgroundColor: '#222',
  },
  playbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleText: {},
  playbackCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
}); 