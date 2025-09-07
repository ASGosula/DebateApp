import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '../constants/firebase';
import { collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
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

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.displayName || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    );
  }, [users, search]);

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

  const deleteUserDoc = async (uid: string) => {
    Alert.alert(
      'Delete Account',
      'This will remove the user document. This does NOT delete Firebase Auth user. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', uid));
            } catch {
              Alert.alert('Error', 'Failed to delete user.');
            }
          }
        }
      ]
    );
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
        <TouchableOpacity style={[styles.btn, styles.delete]} onPress={() => deleteUserDoc(item.id)}>
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
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
      <TextInput
        style={styles.search}
        placeholder="Search by name or email"
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filtered}
        renderItem={renderUser}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={<Text style={styles.empty}>No users</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
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
  delete: { backgroundColor: '#b00020' },
});
