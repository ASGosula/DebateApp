import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, Text, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Link } from 'expo-router';
import ScoreRubricModal, { RubricItem } from '../../components/ScoreRubricModal';
import { auth, db, storage } from '../../constants/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const PREP_TIME_SECONDS = 8 * 60; // Policy prep is often 8-10 min
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

const SELF_REVIEW_CHECKLIST = [
  'Did you speak clearly?',
  'Did you stay on topic?',
  'Did you use evidence?',
  'Did you finish in time?',
  'Did you avoid filler words?'
];

const ENCOURAGEMENTS = [
  'Great job! Keep practicing!',
  'Remember to breathe and pace yourself.',
  'Confidence comes with practice!',
  'Try to make eye contact with your audience.',
  'Strong arguments are clear and concise.'
];

const RUBRIC: RubricItem[] = [
  { key: 'clarity', label: 'Clarity', max: 20 },
  { key: 'organization', label: 'Organization', max: 20 },
  { key: 'evidence', label: 'Evidence/Support', max: 20 },
  { key: 'delivery', label: 'Delivery/Presence', max: 20 },
  { key: 'time', label: 'Time Management', max: 20 },
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

export default function PolicyPractice() {
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
  const [checklist, setChecklist] = useState(Array(SELF_REVIEW_CHECKLIST.length).fill(false));
  const [rating, setRating] = useState(3);
  const [showReview, setShowReview] = useState(false);
  const [encouragement, setEncouragement] = useState('');
  const [rubricVisible, setRubricVisible] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Sound meter logic
  useEffect(() => {
    if (isRecording) {
      soundMeterIntervalRef.current = setInterval(async () => {
        try {
          if (recordingRef.current) {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording) {
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

  const toggleChecklist = (idx: number) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  const resetReview = () => {
    setChecklist(Array(SELF_REVIEW_CHECKLIST.length).fill(false));
    setRating(3);
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
      if (!recordedUri) {
        Alert.alert('No recording', 'Please record first.');
        return;
      }
      setSaving(true);
      const uid = auth.currentUser.uid;
      const ts = Date.now();
      const storageRef = ref(storage, `recordings/${uid}/policy/${ts}.m4a`);
      const resp = await fetch(recordedUri);
      const blob = await resp.blob();
      await uploadBytes(storageRef, blob, { contentType: 'audio/m4a' });
      const url = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'userScores'), {
        uid,
        event: 'Policy',
        total: Math.min(100, total),
        breakdown,
        recordingUrl: url,
        createdAt: serverTimestamp(),
      });
      Alert.alert('Saved', 'Your score and recording were saved to Scores.');
      setRubricVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save score.');
    } finally {
      setSaving(false);
    }
  };

  const getVoiceStatusColor = () => {
    switch (voiceStatus) {
      case 'Good Volume':
        return '#4CAF50';
      case 'Too Low':
        return '#FF9800';
      case 'Too High':
        return '#F44336';
      default:
        return '#666';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Swipe to go back indicator */}
        <View style={styles.swipeIndicator}>
          <ThemedText style={styles.swipeText}>← Swipe to go back</ThemedText>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Policy</ThemedText>
          <ThemedText type="subtitle" style={styles.headerSubtitle}>Practice Debate</ThemedText>
        </View>

        {/* Practice Speaking Button */}
        <View style={{ marginBottom: 16 }}>
          <Link href={"/policy/practice-speaking" as any} style={{ backgroundColor: '#E20000', padding: 12, borderRadius: 8, alignItems: 'center' }}>
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

        {/* Self-Review Checklist */}
        {showReview && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Self-Review Checklist</Text>
            {SELF_REVIEW_CHECKLIST.map((item, idx) => (
              <TouchableOpacity
                key={item}
                style={styles.checklistRow}
                onPress={() => toggleChecklist(idx)}
              >
                <View style={[styles.checkbox, checklist[idx] && styles.checkboxChecked]} />
                <Text style={styles.checklistText}>{item}</Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.sectionTitle}>Rate Yourself</Text>
            <View style={styles.ratingRow}>
              <Text style={styles.ratingLabel}>1</Text>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={rating}
                onValueChange={setRating}
                minimumTrackTintColor="#E20000"
                maximumTrackTintColor="#ccc"
                thumbTintColor="#E20000"
              />
              <Text style={styles.ratingLabel}>5</Text>
            </View>
            <Text style={styles.ratingValue}>Your Rating: {rating}</Text>
            <Text style={styles.encouragement}>{encouragement}</Text>
          </View>
        )}
        <ScoreRubricModal
          visible={rubricVisible}
          onClose={() => setRubricVisible(false)}
          onSubmit={submitScores}
          rubric={RUBRIC}
          title="Self Review (100 pts)"
          onPlay={playRecording}
          onReset={resetReview}
        />
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
  playbackCol: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
    color: '#1a1a1a',
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E20000',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#E20000',
  },
  checklistText: {
    fontSize: 15,
    color: '#222',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#E20000',
    fontWeight: 'bold',
    marginHorizontal: 4,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  ratingValue: {
    fontSize: 15,
    color: '#1a1a1a',
    marginTop: 2,
    marginBottom: 8,
    fontWeight: '500',
  },
  encouragement: {
    fontSize: 14,
    color: '#008000',
    fontWeight: '600',
    marginTop: 8,
    alignSelf: 'center',
  },
}); 