import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { auth, db } from '../constants/firebase';
import { Audio } from 'expo-av';

export default function ScoresPage() {
  const [scores, setScores] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<any>(null);

  useEffect(() => {
    const fetchScores = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(
        collection(db, 'userScores'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setScores(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchScores();
    return () => { if (sound) sound.unloadAsync?.(); };
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Practice Scores</Text>
      {scores.length === 0 && <Text>No scores yet. Record a practice and submit a self review.</Text>}
      {scores.map((s) => (
        <View key={s.id} style={styles.card}>
          <Text style={styles.header}>{s.event ?? 'Practice'} • {new Date(s.createdAt?.toDate?.() ?? s.createdAt ?? Date.now()).toLocaleString()}</Text>
          <Text style={styles.total}>Total: {Math.round(s.total ?? 0)}/100</Text>
          <View style={styles.breakdown}>
            {Object.entries(s.breakdown ?? {}).map(([k, v]: any) => (
              <Text key={k} style={styles.line}>{k}: {v}</Text>
            ))}
          </View>
          {s.recordingUrl ? (
            <TouchableOpacity style={styles.playBtn} onPress={() => play(s.id, s.recordingUrl)}>
              <Text style={styles.playText}>{playingId === s.id ? 'Playing...' : 'Play Recording'}</Text>
            </TouchableOpacity>
          ) : null}
          {s.notes ? <Text style={styles.notes}>Notes: {s.notes}</Text> : null}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  header: { color: '#555', marginBottom: 6 },
  total: { fontSize: 20, fontWeight: '700', color: '#E20000' },
  breakdown: { marginTop: 8 },
  line: { color: '#222', marginTop: 2 },
  notes: { color: '#555', marginTop: 8 },
  playBtn: { marginTop: 10, backgroundColor: '#E20000', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, alignSelf: 'flex-start' },
  playText: { color: '#fff', fontWeight: '700' },
}); 