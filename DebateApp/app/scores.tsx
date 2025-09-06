import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useEffect, useState } from 'react';

function useUserScores() {
  const [scores, setScores] = useState<any[]>([]);
  useEffect(() => {
    const fetchScores = async () => {
      const user = getAuth().currentUser;
      if (!user) return;
      const db = getFirestore();
      const q = query(
        collection(db, 'userScores'),
        where('uid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setScores(snap.docs.map(doc => doc.data()));
    };
    fetchScores();
  }, []);
  return scores;
}

export default function ScoresPage() {
  const scores = useUserScores();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Practice Scores</Text>
      {scores.length === 0 && <Text>No scores yet. Try a practice debate!</Text>}
      {scores.map((score, idx) => (
        <View key={idx} style={styles.card}>
          {score.selfRated ? (
            <>
              <Text style={styles.score}>Self-Rated Score: {score.total}/25</Text>
              <Text style={styles.feedback}>
                Clarity: {score.rubric?.clarity} | Organization: {score.rubric?.organization} | Evidence: {score.rubric?.evidence} | Delivery: {score.rubric?.delivery} | Time: {score.rubric?.timeMgmt}
              </Text>
              {score.comments ? <Text style={styles.feedback}>Comments: {score.comments}</Text> : null}
            </>
          ) : (
            <>
              <Text style={styles.score}>AI Score: {score.score ?? 'N/A'}/100</Text>
              <Text style={styles.feedback}>{score.feedback}</Text>
            </>
          )}
          <Text style={styles.date}>{score.createdAt?.toDate?.().toLocaleString?.() ?? ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 2 },
  score: { fontSize: 18, fontWeight: 'bold', color: '#E20000' },
  feedback: { fontSize: 15, color: '#333', marginTop: 8 },
  date: { fontSize: 12, color: '#888', marginTop: 8 },
}); 