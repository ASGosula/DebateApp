import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert, Text, ScrollView } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useRouter } from 'expo-router';

type RootStackParamList = {
  'Practice Speaking Congress': undefined;
};

const PREP_TIME_SECONDS = 3 * 60; // 3 minutes
const SPEECH_TIME_SECONDS = 3 * 60; // 3 minutes

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

export default function CongressPractice() {
  const router = useRouter();
  // Prep timer state
  const [prepTimeLeft, setPrepTimeLeft] = useState(PREP_TIME_SECONDS);
  const [isPrepRunning, setIsPrepRunning] = useState(false);
  const prepIntervalRef = useRef<any>(null);

  // Speech timer state
  const [speechTimeLeft, setSpeechTimeLeft] = useState(SPEECH_TIME_SECONDS);
  const [isSpeechRunning, setIsSpeechRunning] = useState(false);
  const speechIntervalRef = useRef<any>(null);

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

  // Speech timer logic
  useEffect(() => {
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

  // Recording logic
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

  // UI
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Swipe to go back indicator */}
        <View style={styles.swipeIndicator}>
          <ThemedText style={styles.swipeText}>← Swipe to go back</ThemedText>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={styles.headerTitle}>Congress</ThemedText>
          <ThemedText type="subtitle" style={styles.headerSubtitle}>Practice Debate</ThemedText>
        </View>

        {/* Practice Speaking Button */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity style={{ backgroundColor: '#E20000', padding: 12, borderRadius: 8, alignItems: 'center' }}
            onPress={() => router.push('/congress/practice-speaking')}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Impromptu Practice</Text>
          </TouchableOpacity>
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
              style={styles.controlButton} 
              onPress={() => setIsPrepRunning(true)}
            >
              <ThemedText style={styles.controlButtonText}>Start</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={() => setIsPrepRunning(false)}
            >
              <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={() => { setPrepTimeLeft(PREP_TIME_SECONDS); setIsPrepRunning(false); }}>
              <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Speech Timer Card */}
        <View style={styles.timerCard}>
          <View style={styles.cardHeader}>
            <ThemedText type="subtitle" style={styles.prepLabel}>Speech Timer</ThemedText>
          </View>
          <View style={styles.timerDisplay}>
            <ThemedText type="title" style={styles.timerTextRed}>{formatTime(speechTimeLeft)}</ThemedText>
          </View>
          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={styles.controlButton} 
              onPress={() => setIsSpeechRunning(true)}
            >
              <ThemedText style={styles.controlButtonText}>Start</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.stopButton} 
              onPress={() => setIsSpeechRunning(false)}
            >
              <ThemedText style={styles.controlButtonText}>Stop</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={() => { setSpeechTimeLeft(SPEECH_TIME_SECONDS); setIsSpeechRunning(false); }}>
              <ThemedText style={styles.resetButtonText}>Reset</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.resetAllButton} onPress={() => {
          setIsPrepRunning(false);
          setIsSpeechRunning(false);
          setPrepTimeLeft(PREP_TIME_SECONDS);
          setSpeechTimeLeft(SPEECH_TIME_SECONDS);
        }}>
          <Text style={styles.resetAllButtonText}>Reset All</Text>
        </TouchableOpacity>

        {/* Self-Review Card */}
        <View style={styles.timerCard}>
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
          <View style={styles.timerCard}>
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
  timerDisplay: {
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  controlButton: {
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
  activeButton: {
    opacity: 0.7,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resetButton: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: '#000',
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 44,
  },
  resetButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  playbackRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
    marginTop: 8,
  },
  checklistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#E20000',
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#E20000',
  },
  checklistText: {
    fontSize: 16,
    color: '#222',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#222',
    marginHorizontal: 8,
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  ratingValue: {
    fontSize: 16,
    color: '#222',
    marginTop: 8,
    marginBottom: 8,
  },
  encouragement: {
    fontSize: 15,
    color: '#4CAF50',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  stopButton: {
    backgroundColor: '#E20000',
    borderWidth: 1,
    borderColor: '#E20000',
    flex: 1,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    height: 44,
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