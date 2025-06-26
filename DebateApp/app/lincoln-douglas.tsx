import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';

const BUTTON_COLOR = '#E20000';
const SCREENSHOT = require('../assets/images/Screenshot 2025-06-19 at 10.18.03 AM.png');
const { width } = Dimensions.get('window');

export default function LincolnDouglasScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Image source={SCREENSHOT} style={styles.image} resizeMode="contain" />
      <Text style={styles.title}>Lincoln </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/lincoln-douglas/real')}>
        <Text style={styles.buttonText}>Real Debate</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/lincoln-douglas/practice')}>
        <Text style={styles.buttonText}>Debate Practice</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 36,
    borderRadius: 12,
    marginVertical: 12,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
}); 