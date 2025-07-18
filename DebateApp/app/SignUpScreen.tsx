import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getApps, initializeApp } from 'firebase/app';
import firebaseConfig from '../firebaseConfig';
import { useRouter } from 'expo-router';

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Account created! Please log in.');
      router.replace('/LoginScreen');
    } catch (error) {
      const err = error as any;
      let message = 'Sign up failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'That email is already in use. Please use a different email or log in.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'That email address is invalid.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      Alert.alert('Sign Up Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
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
        textContentType="newPassword"
        autoComplete="password-new"
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        textContentType="oneTimeCode"
        autoComplete="off"
        autoCorrect={false}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
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
    backgroundColor: '#000',
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