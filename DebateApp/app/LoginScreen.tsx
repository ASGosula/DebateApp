import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword, initializeAuth } from 'firebase/auth';
import { initializeApp, getApps } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';
import { useRouter } from 'expo-router';

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Navigate to home or main app page
      router.replace('/HomeScreen');
    } catch (error) {
      const err = error as any;
      let message = 'Login failed. Please try again.';
      if (err.code === 'auth/user-not-found') {
        message = 'No account found with that email.';
      } else if (err.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'That email address is invalid.';
      }
      Alert.alert('Login Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E20000',
    marginBottom: 32,
  },
  input: {
    width: '100%',
    maxWidth: 320,
    height: 48,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#E20000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
    maxWidth: 320,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
}); 