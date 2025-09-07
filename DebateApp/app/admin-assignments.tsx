import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Alert, ScrollView } from 'react-native';
import { auth, db } from '../constants/firebase';
import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';

export default function AdminAssignments() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<'congress' | 'lincoln-douglas' | 'public-forum' | 'policy' | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

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
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const res = await getDocs(q);
      const list = res.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(list);
    };
    init();
  }, []);

  const toggle = (uid: string) => setSelected(prev => ({ ...prev, [uid]: !prev[uid] }));
  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const createAssignment = async () => {
    if (!isAdmin) return;
    if (!title.trim() || !description.trim()) {
      Alert.alert('Missing', 'Please enter a title and description.');
      return;
    }
    let targets = users.filter(u => selected[u.id]).map(u => u.id);
    if (category) {
      const catTargets = users.filter(u => (u as any).category === category).map(u => u.id);
      const set = new Set([...targets, ...catTargets]);
      targets = Array.from(set);
    }
    if (targets.length === 0) {
      Alert.alert('No users', 'Select at least one user to assign.');
      return;
    }
    setSaving(true);
    try {
      const creator = auth.currentUser?.uid;
      const cleanTitle = title.trim();
      const cleanDesc = description.trim();
      const assignmentRef = await addDoc(collection(db, 'assignments'), {
        title: cleanTitle,
        description: cleanDesc,
        createdBy: creator,
        createdAt: serverTimestamp(),
      });
      await Promise.all(
        targets.map(uid => addDoc(collection(db, 'userAssignments'), {
          assignmentId: assignmentRef.id,
          assignmentTitle: cleanTitle,
          assignmentDescription: cleanDesc,
          uid,
          status: 'assigned', // assigned | submitted | feedback
          createdAt: serverTimestamp(),
        }))
      );
      setTitle('');
      setDescription('');
      setSelected({});
      Alert.alert('Assigned', 'Assignment sent to selected users.');
    } catch (e) {
      Alert.alert('Error', 'Failed to create assignment.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <View style={styles.center}><Text>Admin access required.</Text></View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Assign Assignments</Text>
      <TextInput style={styles.input} placeholder="Assignment title" value={title} onChangeText={setTitle} />
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Description / instructions"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <Text style={styles.subtitle}>Assign by Category (optional)</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
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
        {category ? (
          <TouchableOpacity style={[styles.chip, { borderColor: '#b00020' }]} onPress={() => setCategory('')}>
            <Text style={[styles.chipText, { color: '#b00020' }]}>Clear</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.subtitle}>Select Users ({selectedCount})</Text>
      {users.map(u => (
        <TouchableOpacity key={u.id} style={styles.userRow} onPress={() => toggle(u.id)}>
          <View style={[styles.checkbox, selected[u.id] && styles.checkboxOn]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{u.displayName || '(no name)'}</Text>
            <Text style={styles.userEmail}>{u.email}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.assignBtn} onPress={createAssignment} disabled={saving}>
        <Text style={styles.assignText}>{saving ? 'Assigning...' : 'Send Assignment'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ccc' },
  chipOn: { backgroundColor: '#E20000', borderColor: '#E20000' },
  chipText: { color: '#333', fontWeight: '600' },
  chipTextOn: { color: '#fff' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#E20000', marginRight: 10 },
  checkboxOn: { backgroundColor: '#E20000' },
  userName: { fontWeight: '600', color: '#111' },
  userEmail: { color: '#555', fontSize: 12 },
  assignBtn: { backgroundColor: '#E20000', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 14 },
  assignText: { color: '#fff', fontWeight: '700' },
});
