import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { auth, db } from '../constants/firebase';
import { collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';

export default function AdminAssignmentsView() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [feedbackDraft, setFeedbackDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const init = async () => {
      const u = auth.currentUser;
      if (!u) return;
      const snap = await getDoc(doc(db, 'users', u.uid));
      const email = (u.email || '').toLowerCase();
      const seed = email === 'asgosula@gmail.com';
      const allowed = snap.data()?.isAdmin === true || seed;
      setIsAdmin(!!allowed);
      if (!allowed) return;
      const q = query(collection(db, 'userAssignments'));
      const unsub = onSnapshot(q, (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setItems(list);
      });
      return () => unsub();
    };
    init();
  }, []);

  const sendFeedback = async (id: string) => {
    try {
      setSaving(prev => ({ ...prev, [id]: true }));
      await updateDoc(doc(db, 'userAssignments', id), {
        feedback: (feedbackDraft[id] || '').trim(),
        status: 'feedback',
        feedbackAt: new Date(),
      });
      setFeedbackDraft(prev => ({ ...prev, [id]: '' }));
      Alert.alert('Sent', 'Feedback shared with user.');
    } catch (e) {
      Alert.alert('Error', 'Failed to send feedback.');
    } finally {
      setSaving(prev => ({ ...prev, [id]: false }));
    }
  };

  if (!isAdmin) return <View style={styles.center}><Text>Admin access required.</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>View Assignments</Text>
      {items.map(item => (
        <View key={item.id} style={[styles.card, item.status === 'feedback' && styles.cardGreen]}>
          <Text style={styles.header}>{item.assignmentTitle ?? item.assignmentId}</Text>
          {item.assignmentDescription ? <Text style={styles.meta}>{item.assignmentDescription}</Text> : null}
          <Text style={styles.meta}>User: {item.uid}</Text>
          <Text style={styles.meta}>Status: {item.status}</Text>
          {item.submissionAudioUrl ? (
            <Text style={[styles.meta, { color: '#1b5e20' }]}>Audio submitted</Text>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Write feedback..."
            value={feedbackDraft[item.id] ?? ''}
            onChangeText={(t) => setFeedbackDraft(prev => ({ ...prev, [item.id]: t }))}
            multiline
          />
          <TouchableOpacity style={styles.btn} onPress={() => sendFeedback(item.id)} disabled={saving[item.id]}>
            <Text style={styles.btnText}>{saving[item.id] ? 'Sending...' : 'Send Feedback'}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  cardGreen: { borderColor: '#4CAF50' },
  header: { fontWeight: '700', marginBottom: 4 },
  meta: { color: '#555', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: '#E20000', paddingVertical: 10, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '700' },
});
