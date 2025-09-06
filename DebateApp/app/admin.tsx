import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../constants/firebase';
import { collection, doc, getDoc, onSnapshot, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // verify current user is admin via users doc
    const check = async () => {
      const u = auth.currentUser;
      if (!u) {
        router.replace('/welcome' as any);
        return;
      }
      const snap = await getDoc(doc(db, 'users', u.uid));
      const email = (u.email || '').toLowerCase();
      const seedAdmin = email === 'asgosula@gmail.com';
      const allowed = snap.data()?.isAdmin === true || seedAdmin;
      setIsAdmin(!!allowed);
      if (!allowed) {
        Alert.alert('Not authorized', 'Admin access required');
        router.replace('/' as any);
      }
    };
    check();
  }, [router]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const pending = useMemo(() => users.filter(u => u.status === 'pending'), [users]);
  const waitlist = useMemo(() => users.filter(u => u.status === 'waitlist'), [users]);
  const approved = useMemo(() => users.filter(u => u.status === 'approved'), [users]);

  const setStatus = async (uid: string, status: 'pending' | 'approved' | 'rejected' | 'waitlist') => {
    try {
      await updateDoc(doc(db, 'users', uid), { status });
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const setAdmin = async (uid: string, makeAdmin: boolean) => {
    try {
      await updateDoc(doc(db, 'users', uid), { isAdmin: makeAdmin });
    } catch {
      Alert.alert('Error', 'Failed to update admin flag');
    }
  };

  const renderUser = ({ item }: any) => (
    <View style={styles.card}>
      <Text style={styles.name}>{item.displayName || '(no name)'} {item.isAdmin ? '🛡️' : ''}</Text>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.meta}>Status: {item.status || 'pending'}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={[styles.btn, styles.approve]} onPress={() => setStatus(item.id, 'approved')}>
          <Text style={styles.btnText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.waitlist]} onPress={() => setStatus(item.id, 'waitlist')}>
          <Text style={styles.btnText}>Waitlist</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => setStatus(item.id, 'rejected')}>
          <Text style={styles.btnText}>Reject</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.row}>
        {item.isAdmin ? (
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => setAdmin(item.id, false)}>
            <Text style={styles.btnText}>Remove Admin</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => setAdmin(item.id, true)}>
            <Text style={styles.btnText}>Make Admin</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (!isAdmin) {
    return (
      <View style={styles.center}> 
        <ActivityIndicator />
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.sectionTitle}>Pending ({pending.length})</Text>
      <FlatList data={pending} renderItem={renderUser} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={styles.empty}>No pending users</Text>} />
      <Text style={styles.sectionTitle}>Waitlist ({waitlist.length})</Text>
      <FlatList data={waitlist} renderItem={renderUser} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={styles.empty}>No waitlisted users</Text>} />
      <Text style={styles.sectionTitle}>Approved ({approved.length})</Text>
      <FlatList data={approved} renderItem={renderUser} keyExtractor={(i) => i.id} ListEmptyComponent={<Text style={styles.empty}>No approved users</Text>} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  empty: { color: '#666' },
  card: { borderWidth: 1, borderColor: '#eee', borderRadius: 10, padding: 12, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '600' },
  email: { color: '#555', marginTop: 2 },
  meta: { color: '#777', marginTop: 6 },
  row: { flexDirection: 'row', marginTop: 8 },
  btn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginRight: 8 },
  btnText: { color: '#fff', fontWeight: '600' },
  approve: { backgroundColor: '#2e7d32' },
  waitlist: { backgroundColor: '#f9a825' },
  reject: { backgroundColor: '#c62828' },
  secondary: { backgroundColor: '#3f51b5' },
});
