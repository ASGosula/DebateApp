import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width } = Dimensions.get('window');

export default function CongressScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.container}>
      <Image source={SCREENSHOT} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>Congress</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/congress/real')}>
        <Text style={styles.buttonText}>Real Debate Congress</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/congress/practice')}>
        <Text style={styles.buttonText}>Practice Debate Congress</Text>
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
    fontSize: 28,
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