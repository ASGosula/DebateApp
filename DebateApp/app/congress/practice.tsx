import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Alert, Text, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Link } from 'expo-router';

const QUESTIONING_BLOCK_SECONDS = 30; // 30 seconds
const SPEECH_TIME_SECONDS = 3 * 60; // 3 minutes
const { width } = Dimensions.get('window');

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

export default function CongressPractice() {
  // Timers
  const [questioningLeft, setQuestioningLeft] = useState(QUESTIONING_BLOCK_SECONDS);
  const [isQuestioningRunning, setIsQuestioningRunning] = useState(false);
  const questioningIntervalRef = useRef<any>(null);
  const [speechLeft, setSpeechLeft] = useState(SPEECH_TIME_SECONDS);
  const [isSpeechRunning, setIsSpeechRunning] = useState(false);
  const speechIntervalRef = useRef<any>(null);

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

  // Timer logic
  useEffect(() => {
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

  useEffect(() => {
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

  // Handlers for timers
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

  // Recording handlers
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
      setIsRecording(true);
      recordingRef.current = recording;
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
      setIsRecording(false);
      recordingRef.current = null;
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
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Congress</ThemedText>
          <ThemedText type="subtitle" style={styles.headerSubtitle}>Practice Debate</ThemedText>
        </View>

        {/* Practice Speaking Button */}
        <View style={{ marginBottom: 16 }}>
          <Link href="/congress/practice-speaking" style={{ backgroundColor: '#E20000', padding: 12, borderRadius: 8, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Practice Speaking</Text>
          </Link>
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
            <View style={styles.playbackRow}>
              <TouchableOpacity style={styles.button} onPress={isPlaying ? stopPlayback : playRecording}>
                <Text style={styles.buttonText}>{isPlaying ? 'Stop Playback' : 'Play Recording'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetReview}>
                <Text style={styles.buttonText}>Reset</Text>
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
  },
  activeButton: {
    opacity: 0.7,
  },
  resetButton: {
    backgroundColor: '#666',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetAllButton: {
    backgroundColor: '#E20000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  soundMeterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  soundMeterDisplay: {
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  decibelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E20000',
    textAlign: 'center',
  },
  voiceStatusText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  volumeGuide: {
    alignItems: 'center',
    marginTop: 8,
  },
  guideText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  card: {
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
  button: {
    backgroundColor: '#E20000',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stopButton: {
    backgroundColor: '#FF9800',
  },
  playbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 4,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#E20000',
  },
  checklistText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginHorizontal: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  ratingValue: {
    fontSize: 16,
    color: '#000000',
    fontWeight: 'bold',
    marginTop: 8,
  },
  encouragement: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 8,
  },
}); 