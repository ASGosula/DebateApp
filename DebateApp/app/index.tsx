import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Image source={SCREENSHOT} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>Welcome to Debate App!</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/lincoln-douglas')}
      >
        <Text style={styles.buttonText}>Lincoln Douglas</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/public-forum')}
      >
        <Text style={styles.buttonText}>Public Forum</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/congress')}
      >
        <Text style={styles.buttonText}>Congress</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push('/policy' as any)}
      >
        <Text style={styles.buttonText}>Policy</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
  image: {
    width: width * 0.8,
    maxWidth: 350,
    height: 140,
    borderRadius: 18,
    marginBottom: 24,
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#222',
    textAlign: 'center',
  },
  button: {
    backgroundColor: BUTTON_COLOR,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginVertical: 8,
    width: '80%',
    maxWidth: 280,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
}); 