import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');

export default function HomeScreen() {
  const router = useRouter();
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={SCREENSHOT} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>Welcome to the Debate App</Text>
      <Text style={styles.subtitle}>Your comprehensive debate companion</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/practice')}>
        <Text style={styles.buttonText}>Practice</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/resources')}>
        <Text style={styles.buttonText}>Resources</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/congress')}>
        <Text style={styles.buttonText}>Congress</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/lincoln-douglas')}>
        <Text style={styles.buttonText}>Lincoln Douglas</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/public-forum')}>
        <Text style={styles.buttonText}>Public Forum</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  logo: {
    width: 180,
    height: 80,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#E20000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    width: 220,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 