import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { auth, db } from '../constants/firebase';
import { Audio } from 'expo-av';

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const q = query(collection(db, 'userScores'), where('uid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      items.sort((a: any, b: any) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setScores(items);
    });
    return () => { unsub(); if (sound) sound.unloadAsync?.(); };
  }, []);

  const play = async (id: string, uri: string) => {
    try {
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }
      const { sound: s } = await Audio.Sound.createAsync({ uri });
      setSound(s);
      setPlayingId(id);
      s.setOnPlaybackStatusUpdate((st) => {
        if (!st.isLoaded || st.didJustFinish) {
          setPlayingId(null);
        }
      });
      await s.playAsync();
    } catch {
      setPlayingId(null);
    }
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Score', 'Are you sure you want to delete this score?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteScore(id) },
    ]);
  };

  const deleteScore = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'userScores', id));
    } catch (e) {
      Alert.alert('Error', 'Failed to delete score. Check Firestore rules allow delete.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Practice Scores</Text>
      {scores.length === 0 && <Text>No scores yet. Record, then Self Review & Save. If you just saved, reopen this page.</Text>}
      {scores.map((s) => (
        <View key={s.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.header}>{s.event ?? 'Practice'} • {new Date(s.createdAt?.toDate?.() ?? s.createdAt ?? Date.now()).toLocaleString()}</Text>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(s.id)}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.total}>Total: {Math.round(s.total ?? 0)}/100</Text>
          <View style={styles.breakdown}>
            {Object.entries(s.breakdown ?? {}).map(([k, v]: any) => (
              <Text key={k} style={styles.line}>{k}: {v}</Text>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  header: { color: '#555', marginBottom: 6, flex: 1, marginRight: 8 },
  deleteBtn: { paddingVertical: 6, paddingHorizontal: 10, backgroundColor: '#E20000', borderRadius: 8 },
  deleteText: { color: '#fff', fontWeight: '700' },
  total: { fontSize: 20, fontWeight: '700', color: '#E20000' },
  breakdown: { marginTop: 8 },
  line: { color: '#222', marginTop: 2 },
}); 