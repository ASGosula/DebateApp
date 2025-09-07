import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../constants/firebase';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [category, setCategory] = useState<'congress' | 'lincoln-douglas' | 'public-forum' | 'policy' | ''>('');

  const handleSignup = async () => {
    setError('');
    if (!displayName.trim()) {
      setError('Please enter a display name');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: displayName.trim() });
      }
      const uid = cred.user.uid;
      const isSeedAdmin = email.trim().toLowerCase() === 'asgosula@gmail.com';
      const userRef = doc(db, 'users', uid);
      const existing = await getDoc(userRef);
      const userDoc = {
        uid,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        category: category || null,
        status: isSeedAdmin ? 'approved' : 'pending', // pending | approved | rejected | waitlist
        isAdmin: isSeedAdmin,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      } as any;
      if (existing.exists()) {
        await setDoc(userRef, { ...existing.data(), ...userDoc, updatedAt: serverTimestamp() }, { merge: true });
      } else {
        await setDoc(userRef, userDoc);
      }
      router.replace('/');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>
      <Text style={styles.subtitle}>Create your account to get started.</Text>
      <TextInput
        style={styles.input}
        placeholder="Display name"
        placeholderTextColor="#B0B3B8"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#B0B3B8"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoComplete="email"
        textContentType="emailAddress"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#B0B3B8"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        placeholderTextColor="#B0B3B8"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <Text style={styles.label}>Select Debate Category</Text>
      <View style={styles.categoryRow}>
        {[
          { k: 'congress', label: 'Congress' },
          { k: 'lincoln-douglas', label: 'Lincoln-Douglas' },
          { k: 'public-forum', label: 'Public Forum' },
          { k: 'policy', label: 'Policy' },
        ].map(opt => (
          <TouchableOpacity
            key={opt.k}
            style={[styles.chip, category === opt.k ? styles.chipOn : undefined]}
            onPress={() => setCategory(opt.k as any)}
          >
            <Text style={[styles.chipText, category === opt.k ? styles.chipTextOn : undefined]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
      </TouchableOpacity>
      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>Already have an account?</Text>
        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text style={styles.linkText}>Log In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: width * 0.8,
    backgroundColor: '#f8f9fa',
    color: '#222',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#23262F',
  },
  button: {
    width: width * 0.8,
    backgroundColor: '#E20000',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 18,
    shadowColor: '#E20000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  error: {
    color: '#E20000',
    marginBottom: 12,
    textAlign: 'center',
  },
  bottomTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  bottomText: {
    color: '#666',
    fontSize: 15,
  },
  linkText: {
    color: '#E20000',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  label: { width: width * 0.8, color: '#333', marginBottom: 8, fontWeight: '600' },
  categoryRow: { width: width * 0.8, flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipOn: { backgroundColor: '#E20000', borderColor: '#E20000' },
  chipText: { color: '#333', fontWeight: '600' },
  chipTextOn: { color: '#fff' },
}); 