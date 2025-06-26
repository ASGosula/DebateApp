import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';

export default function PublicForumPracticeSpeaking() {
  // Voice meter state
  const [isRecording, setIsRecording] = useState(false);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const [voiceStatus, setVoiceStatus] = useState('Not Recording');
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundMeterIntervalRef = useRef<any>(null);

  // Voice meter logic (copied from Lincoln Douglas)
  React.useEffect(() => {
    if (isRecording) {
      soundMeterIntervalRef.current = setInterval(async () => {
        try {
          if (recordingRef.current) {
            const status = await recordingRef.current.getStatusAsync();
            if (status.isRecording) {
              // Simulate amplitude/decibel
              const baseAmplitude = 0.1;
              const noiseLevel = Math.random() * 0.3;
              const voiceAmplitude = Math.random() * 0.4;
              const amplitude = baseAmplitude + noiseLevel + voiceAmplitude;
              const db = 20 * Math.log10(amplitude / 0.0001);
              setDecibelLevel(Math.max(30, Math.min(80, db + 40)));
              if (db + 40 >= 65 && db + 40 <= 75) {
                setVoiceStatus('Good Volume');
              } else if (db + 40 < 65) {
                setVoiceStatus('Too Low');
              } else {
                setVoiceStatus('Too High');
              }
            }
          }
        } catch (error) {
          // ignore
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

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission Denied', 'Microphone permission is required.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Could not start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
      setIsRecording(false);
    } catch (err) {
      Alert.alert('Error', 'Could not stop recording.');
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
    <View style={styles.container}>
      <Text style={styles.title}>Public Forum Practice Speaking</Text>
      {/* Voice Meter copied from Lincoln Douglas */}
      <View style={styles.voiceMeterCard}>
        <Text style={styles.voiceMeterLabel}>Voice Level Meter</Text>
        <Text style={styles.decibelText}>{Math.round(decibelLevel)} dB</Text>
        <Text style={[styles.voiceStatusText, { color: getVoiceStatusColor() }]}>{voiceStatus}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.controlButton, isRecording && styles.activeButton]} onPress={startRecording}>
            <Text style={styles.controlButtonText}>Start</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlButton, !isRecording && styles.activeButton]} onPress={stopRecording}>
            <Text style={styles.controlButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.guideText}>
          Target: 65-75 dB (Green) | Below 65 dB: Too Low (Orange) | Above 75 dB: Too High (Red)
        </Text>
      </View>
      <Text style={styles.text}>This is a placeholder for the Practice Speaking feature. Add your speaking practice tools here!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#E20000',
    textAlign: 'center',
  },
  voiceMeterCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  voiceMeterLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E20000',
    marginBottom: 8,
  },
  decibelText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 4,
  },
  voiceStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  controlButton: {
    backgroundColor: '#E20000',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  activeButton: {
    opacity: 0.7,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  guideText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  text: {
    fontSize: 18,
    color: '#222',
    textAlign: 'center',
  },
}); 