import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../constants/firebase';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'congress' | 'lincoln-douglas' | 'public-forum' | 'policy' | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = auth.currentUser;
      if (!u) { router.replace('/welcome' as any); return; }
      setEmail(u.email || '');
      const snap = await getDoc(doc(db, 'users', u.uid));
      const data: any = snap.data() || {};
      setDisplayName(data.displayName || u.displayName || '');
      setCategory(data.category || '');
    };
    init();
  }, [router]);

  const save = async () => {
    try {
      const u = auth.currentUser;
      if (!u) return;
      setSaving(true);
      await updateDoc(doc(db, 'users', u.uid), {
        displayName: displayName.trim(),
        category: category || null,
        updatedAt: serverTimestamp(),
      });
      Alert.alert('Saved', 'Profile updated.');
    } catch {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async () => {
    try {
      if (!email) { Alert.alert('Error', 'No email found.'); return; }
      await sendPasswordResetEmail(auth, email);
      Alert.alert('Email sent', 'Check your inbox for password reset.');
    } catch {
      Alert.alert('Error', 'Failed to send reset email.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Your Profile</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput style={[styles.input, { backgroundColor: '#f3f4f6' }]} editable={false} value={email} />
      <Text style={styles.label}>Display Name</Text>
      <TextInput style={styles.input} value={displayName} onChangeText={setDisplayName} />

      <Text style={styles.label}>Debate Category</Text>
      <View style={styles.row}>
        {[
          { k: 'congress', label: 'Congress' },
          { k: 'lincoln-douglas', label: 'Lincoln-Douglas' },
          { k: 'public-forum', label: 'Public Forum' },
          { k: 'policy', label: 'Policy' },
        ].map(opt => (
          <TouchableOpacity key={opt.k} style={[styles.chip, category === (opt.k as any) && styles.chipOn]} onPress={() => setCategory(opt.k as any)}>
            <Text style={[styles.chipText, category === (opt.k as any) && styles.chipTextOn]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primary} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondary} onPress={resetPassword}>
        <Text style={styles.secondaryText}>Send Password Reset Email</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  label: { color: '#333', fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipOn: { backgroundColor: '#E20000', borderColor: '#E20000' },
  chipText: { color: '#333', fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  primary: { backgroundColor: '#E20000', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 6 },
  primaryText: { color: '#fff', fontWeight: '700' },
  secondary: { backgroundColor: '#3f51b5', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  secondaryText: { color: '#fff', fontWeight: '700' },
});


