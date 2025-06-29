import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, Text, FlatList, ScrollView, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Link } from 'expo-router';

const PREP_TIME_SECONDS = 8 * 60; // 8 minutes per team
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

export default function PolicyDebatePractice() {
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
    <SafeAreaView style={{flex: 1}}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.container}>
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
              <ThemedText type="title" style={styles.timerText}>{formatTime(debateTimeLeft)}</ThemedText>
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
              <TouchableOpacity style={styles.skipButton} onPress={() => setDebateTimeLeft((prev) => Math.max(0, prev - 10))}>
                <ThemedText style={styles.skipButtonText}>-10s</ThemedText>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.resetAllButton} onPress={handleDebateResetAll}>
              <ThemedText style={styles.resetButtonText}>Reset All</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Recording Section */}
          <View style={styles.timerCard}>
            <View style={styles.cardHeader}>
              <ThemedText type="subtitle" style={styles.recordingLabel}>Recording</ThemedText>
            </View>
            {!recording && !recordedUri && (
              <TouchableOpacity style={styles.recordingButton} onPress={startRecording}>
                <ThemedText style={styles.recordingButtonText}>Start Recording</ThemedText>
              </TouchableOpacity>
            )}
            {recording && (
              <TouchableOpacity style={styles.stopRecordingButton} onPress={stopRecording}>
                <ThemedText style={styles.recordingButtonText}>Stop Recording</ThemedText>
              </TouchableOpacity>
            )}
            {recordedUri && !recording && (
              <View style={styles.playbackRow}>
                <TouchableOpacity style={styles.recordingButton} onPress={isPlaying ? stopPlayback : playRecording}>
                  <ThemedText style={styles.recordingButtonText}>{isPlaying ? 'Stop Playback' : 'Play Recording'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.recordingButton} onPress={resetReview}>
                  <ThemedText style={styles.recordingButtonText}>Reset</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Self-Review Card */}
          {showReview && (
            <View style={styles.timerCard}>
              <View style={styles.cardHeader}>
                <ThemedText type="subtitle" style={styles.reviewLabel}>Self Review</ThemedText>
              </View>
              <View style={styles.reviewSection}>
                <ThemedText type="default" style={styles.encouragementText}>{encouragement}</ThemedText>
                <TouchableOpacity style={styles.playButton} onPress={playRecording} disabled={isPlaying}>
                  <ThemedText style={styles.playButtonText}>{isPlaying ? 'Playing...' : 'Play Recording'}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.stopButton} onPress={stopPlayback} disabled={!isPlaying}>
                  <ThemedText style={styles.stopButtonText}>Stop</ThemedText>
                </TouchableOpacity>
                <View style={styles.checklistSection}>
                  {SELF_REVIEW_CHECKLIST.map((item, idx) => (
                    <TouchableOpacity key={idx} style={styles.checklistItem} onPress={() => toggleChecklist(idx)}>
                      <View style={[styles.checkbox, checklist[idx] && styles.checkboxChecked]} />
                      <ThemedText style={styles.checklistText}>{item}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.ratingSection}>
                  <ThemedText style={styles.ratingLabel}>How would you rate your performance?</ThemedText>
                  <Slider
                    style={{ width: width * 0.6, height: 40 }}
                    minimumValue={1}
                    maximumValue={5}
                    step={1}
                    value={rating}
                    onValueChange={setRating}
                    minimumTrackTintColor="#E20000"
                    maximumTrackTintColor="#000"
                    thumbTintColor="#E20000"
                  />
                  <ThemedText style={styles.ratingValue}>{rating} / 5</ThemedText>
                </View>
                <TouchableOpacity style={styles.resetReviewButton} onPress={resetReview}>
                  <ThemedText style={styles.resetReviewButtonText}>Reset Review</ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E20000',
    textAlign: 'center',
  },
  timerTextRed: {
    fontSize: 28,
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
  soundMeterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 2,
  },
  soundMeterDisplay: {
    alignItems: 'center',
    marginBottom: 8,
  },
  decibelText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
  },
  voiceStatusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  volumeGuide: {
    marginTop: 4,
  },
  guideText: {
    fontSize: 12,
    color: '#888',
  },
  reviewLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 2,
  },
  reviewSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  encouragementText: {
    fontSize: 14,
    color: '#4CAF50',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  playButton: {
    backgroundColor: '#E20000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  playButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stopButton: {
    backgroundColor: '#b30000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  stopButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  checklistSection: {
    marginTop: 8,
    width: '100%',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#E20000',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#E20000',
  },
  checklistText: {
    fontSize: 14,
    color: '#222',
  },
  ratingSection: {
    marginTop: 8,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E20000',
    marginTop: 4,
  },
  resetReviewButton: {
    backgroundColor: '#E20000',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  resetReviewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  recordingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 2,
  },
  recordingButton: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#E20000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  recordingButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  stopRecordingButton: {
    backgroundColor: '#b30000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#b30000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  playbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
}); 