import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { ThemedText } from '@/components/ThemedText';

const PROMPTS = [
  'Should the filibuster be abolished in Congress?',
  'What is the most important role of a legislator?',
  'Should there be term limits for members of Congress?',
  'How can Congress better represent the people?',
  'Should campaign finance be reformed?',
  'What is the value of debate in a legislative body?',
  'Should Congress have more oversight over the executive branch?',
  'How can partisanship in Congress be reduced?',
  'What is the most pressing issue facing Congress today?',
  'Should committee hearings be open to the public?'
];

const SELF_REVIEW_CHECKLIST = [
  'Did you speak clearly?',
  'Did you stay on topic?',
  'Did you organize your thoughts?',
  'Did you use examples?',
  'Did you avoid filler words?'
];

const ENCOURAGEMENTS = [
  'Great job! Keep practicing!',
  'Remember to breathe and pace yourself.',
  'Confidence comes with practice!',
  'Try to make eye contact with your audience.',
  'Strong arguments are clear and concise.'
];

const TIPS = {
  'Did you speak clearly?': [
    'Practice enunciating each word.',
    'Record yourself and listen for mumbling.',
    'Slow down your speech to improve clarity.'
  ],
  'Did you stay on topic?': [
    'Write down your main point before speaking.',
    'If you get off track, pause and return to your main idea.',
    'Practice summarizing your answer in one sentence.'
  ],
  'Did you organize your thoughts?': [
    'Use a simple structure: introduction, body, conclusion.',
    'List your points before you start speaking.',
    'Practice outlining your answer mentally before responding.'
  ],
  'Did you use examples?': [
    'Think of a real-life story or fact to support your point.',
    'Use phrases like "For example..." or "For instance..."',
    'Practice connecting your ideas to things you know.'
  ],
  'Did you avoid filler words?': [
    'Pause instead of saying "um" or "like".',
    'Practice speaking slowly and deliberately.',
    'Record yourself and count your filler words.'
  ]
};

function getRandomPrompt() {
  return PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
}

export default function CongressPracticeSpeaking() {
  const [step, setStep] = useState<'prompt'|'think'|'record'|'review'>('prompt');
  const [prompt, setPrompt] = useState(getRandomPrompt());
  const [thinkTime, setThinkTime] = useState(10);
  const [recordTime, setRecordTime] = useState(180); // 3 minutes for Congress
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [checklist, setChecklist] = useState<boolean[]>(Array(SELF_REVIEW_CHECKLIST.length).fill(false));
  const [rating, setRating] = useState(3);
  const [encouragement, setEncouragement] = useState('');
  const thinkInterval = useRef<number | null>(null);
  const recordInterval = useRef<number | null>(null);

  // Think timer
  React.useEffect(() => {
    if (step === 'think' && thinkTime > 0) {
      thinkInterval.current = window.setTimeout(() => setThinkTime(thinkTime - 1), 1000);
    } else if (step === 'think' && thinkTime === 0) {
      setStep('record');
      setThinkTime(10);
      startRecording();
    }
    return () => {
      if (thinkInterval.current !== null) clearTimeout(thinkInterval.current);
    };
  }, [step, thinkTime]);

  // Record timer
  React.useEffect(() => {
    if (step === 'record' && recordTime > 0) {
      recordInterval.current = window.setTimeout(() => setRecordTime(recordTime - 1), 1000);
    } else if (step === 'record' && recordTime === 0) {
      stopRecording();
      setRecordTime(180);
    }
    return () => {
      if (recordInterval.current !== null) clearTimeout(recordInterval.current);
    };
  }, [step, recordTime]);

  async function startRecording() {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        setStep('prompt');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setRecordedUri(null);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording.');
      setStep('prompt');
    }
  }

  async function stopRecording() {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI() || null;
        setRecordedUri(uri);
        setRecording(null);
        if (!uri) {
          Alert.alert('Error', 'No recording URI found.');
        } else {
          console.log('Recording URI:', uri);
        }
        setStep('review');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not stop recording.');
    }
  }

  async function playRecording() {
    if (!recordedUri) {
      Alert.alert('Error', 'No recording found to play.');
      return;
    }
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        interruptionModeIOS: 1,
        shouldDuckAndroid: true,
        interruptionModeAndroid: 1,
        playThroughEarpieceAndroid: false,
      });
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: recordedUri });
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('isPlaying' in status && !status.isPlaying) {
          setIsPlaying(false);
        }
      });
      await newSound.playAsync();
    } catch (err) {
      Alert.alert('Error', 'Could not play recording. Make sure your device is not in silent mode and volume is up.');
    }
  }

  function handleChecklistToggle(idx: number) {
    setChecklist(prev => prev.map((v, i) => (i === idx ? !v : v)));
  }

  function handleReviewSubmit() {
    let tipsMsg = '';
    SELF_REVIEW_CHECKLIST.forEach((item) => {
      tipsMsg += `\n\u2022 ${item}\n`;
      (TIPS[item as keyof typeof TIPS] as string[]).forEach((tip: string) => {
        tipsMsg += `   - ${tip}\n`;
      });
    });
    const encouragementMsg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    tipsMsg += `\n${encouragementMsg}`;
    Alert.alert('Speaking Tips', tipsMsg, [
      { text: 'OK', onPress: () => setEncouragement(encouragementMsg) }
    ]);
  }

  function handleTryAnother() {
    setPrompt(getRandomPrompt());
    setChecklist(Array(SELF_REVIEW_CHECKLIST.length).fill(false));
    setRating(3);
    setRecordedUri(null);
    setRecordTime(180);
    setStep('prompt');
  }

  return (
    <View style={styles.container}>
      <View style={styles.swipeIndicator}>
        <ThemedText style={styles.swipeText}>← Swipe to go back</ThemedText>
      </View>
      {step === 'prompt' && (
        <View style={styles.card}>
          <Text style={styles.title}>Impromptu Practice</Text>
          <Text style={styles.prompt}>{prompt}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setStep('think')}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === 'think' && (
        <View style={styles.card}>
          <Text style={styles.title}>Get Ready...</Text>
          <Text style={styles.timer}>{thinkTime}s</Text>
          <Text style={styles.subtext}>Think about your answer!</Text>
        </View>
      )}
      {step === 'record' && (
        <View style={styles.card}>
          <Text style={styles.title}>Speak Now!</Text>
          <Text style={styles.timer}>{recordTime}s</Text>
          <TouchableOpacity style={styles.button} onPress={stopRecording}>
            <Text style={styles.buttonText}>Stop Early</Text>
          </TouchableOpacity>
        </View>
      )}
      {step === 'review' && (
        <View style={styles.card}>
          <Text style={styles.title}>Playback & Self-Review</Text>
          <TouchableOpacity style={styles.button} onPress={playRecording} disabled={isPlaying}>
            <Text style={styles.buttonText}>{isPlaying ? 'Playing...' : 'Play Recording'}</Text>
          </TouchableOpacity>
          <View style={{ width: '100%', marginTop: 16 }}>
            {SELF_REVIEW_CHECKLIST.map((item, idx) => (
              <TouchableOpacity key={idx} style={styles.checklistItem} onPress={() => handleChecklistToggle(idx)}>
                <Text style={{ color: checklist[idx] ? '#1a73e8' : '#333' }}>{checklist[idx] ? '\u2713 ' : ''}{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.subtext}>Rate yourself:</Text>
          <Slider
            style={{ width: 220, alignSelf: 'center', height: 40 }}
            minimumValue={1}
            maximumValue={5}
            step={1}
            value={rating}
            onValueChange={setRating}
            minimumTrackTintColor="#E20000"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#E20000"
          />
          <Text style={styles.ratingValue}>Your Rating: {rating}</Text>
          <TouchableOpacity style={styles.button} onPress={handleReviewSubmit}>
            <Text style={styles.buttonText}>Get Tips</Text>
          </TouchableOpacity>
          <Text style={styles.encouragement}>{encouragement}</Text>
          <TouchableOpacity style={styles.button} onPress={handleTryAnother}>
            <Text style={styles.buttonText}>Try Another Prompt</Text>
          </TouchableOpacity>
        </View>
      )}
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
    width: '95%',
    maxWidth: 500,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
  },
  prompt: {
    fontSize: 18,
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
}); 