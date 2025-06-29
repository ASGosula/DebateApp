import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

const PROMPTS = [
  'Should the United States federal government increase its investment in renewable energy?',
  'Is the policy of mandatory minimum sentencing effective in reducing crime?',
  'Should the U.S. adopt a universal healthcare system?',
  'Is the current immigration policy in the U.S. fair and effective?',
  'Should the government provide free college education?',
  'Is net neutrality essential for a free and open internet?',
  'Should the U.S. federal government ban single-use plastics?',
  'Is the policy of affirmative action still necessary?',
  'Should the U.S. lower the voting age to 16?',
  'Is the current tax policy equitable for all citizens?'
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

export default function PolicyPracticeSpeaking() {
  const [step, setStep] = useState<'prompt'|'think'|'record'|'review'>('prompt');
  const [prompt, setPrompt] = useState(getRandomPrompt());
  const [thinkTime, setThinkTime] = useState(10);
  const [recordTime, setRecordTime] = useState(60);
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
      setRecordTime(60);
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
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setRecordedUri(null);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording.');
    }
  }

  async function stopRecording() {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        setRecordedUri(recording.getURI() || null);
        setRecording(null);
        setStep('review');
        setEncouragement(ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]);
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

  async function stopPlayback() {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not stop playback.');
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
    setRecordTime(60);
    setStep('prompt');
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        {step === 'prompt' && (
          <View style={styles.card}>
            <Text style={styles.title}>Impromptu Policy Practice</Text>
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
            <Text style={styles.title}>Self Review</Text>
            <TouchableOpacity style={styles.button} onPress={playRecording} disabled={isPlaying}>
              <Text style={styles.buttonText}>{isPlaying ? 'Playing...' : 'Play Recording'}</Text>
            </TouchableOpacity>
            <View style={styles.checklistSection}>
              {SELF_REVIEW_CHECKLIST.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.checklistItem} onPress={() => handleChecklistToggle(idx)}>
                  <View style={[styles.checkbox, checklist[idx] && styles.checkboxChecked]} />
                  <Text style={styles.checklistText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ratingSection}>
              <Text style={styles.ratingLabel}>How would you rate your performance?</Text>
              <Slider
                style={{ width: 200, height: 40 }}
                minimumValue={1}
                maximumValue={5}
                step={1}
                value={rating}
                onValueChange={setRating}
                minimumTrackTintColor="#E20000"
                maximumTrackTintColor="#000"
                thumbTintColor="#E20000"
              />
              <Text style={styles.ratingValue}>{rating} / 5</Text>
            </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    width: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
    textAlign: 'center',
  },
  prompt: {
    fontSize: 16,
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  timer: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#E20000',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  encouragement: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
}); 