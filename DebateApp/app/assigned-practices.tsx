import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { auth, db, storage } from '../constants/firebase';
import { collection, onSnapshot, query, updateDoc, doc, where, serverTimestamp } from 'firebase/firestore';
import { Audio } from 'expo-av';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as Sharing from 'expo-sharing';

export default function AssignedPractices() {
  const [items, setItems] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;
    const q = query(collection(db, 'userAssignments'), where('uid', '==', u.uid));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setItems(list);
    });
    return () => unsub();
  }, []);

  const assigned = useMemo(() => items.filter(i => i.status !== 'feedback' && i.status !== 'submitted'), [items]);
  const completed = useMemo(() => items.filter(i => i.status === 'submitted' || i.status === 'feedback'), [items]);

  const open = (id: string) => { setOpenId(id); setNote(''); setRecording(null); setRecordingUri(null); cleanupSound(); };
  const close = () => { setOpenId(null); setNote(''); stopRecordingIfNeeded(); cleanupSound(); };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();
      setRecording(rec);
    } catch (e) {
      Alert.alert('Recording Error', 'Unable to start recording.');
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordingUri(uri || null);
    } catch (e) {
      Alert.alert('Recording Error', 'Unable to stop recording.');
    }
  };

  const stopRecordingIfNeeded = async () => {
    try {
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        setRecordingUri(uri || null);
      }
    } catch {
      // noop
    }
  };

  const play = async () => {
    try {
      if (!recordingUri) return;
      await cleanupSound();
      const { sound: s } = await Audio.Sound.createAsync({ uri: recordingUri });
      setSound(s);
      s.setOnPlaybackStatusUpdate((status: any) => setIsPlaying(!!status.isPlaying));
      await s.playAsync();
    } catch (e) {
      Alert.alert('Playback Error', 'Unable to play the recording.');
    }
  };

  const pause = async () => {
    try {
      if (!sound) return;
      const status = await sound.getStatusAsync();
      if ((status as any).isPlaying) await sound.pauseAsync();
    } catch {}
  };

  const cleanupSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
    } catch {} finally {
      setSound(null);
      setIsPlaying(false);
    }
  };

  const submit = async () => {
    if (!openId) return;
    try {
      setSaving(true);
      let submissionAudioUrl: string | null = null;
      const u = auth.currentUser;
      if (u && recordingUri) {
        const res = await fetch(recordingUri);
        const blob = await res.blob();
        const key = `recordings/${u.uid}/${openId}.m4a`;
        const r = ref(storage, key);
        await uploadBytes(r, blob, { contentType: 'audio/m4a' });
        submissionAudioUrl = await getDownloadURL(r);
      }
      await updateDoc(doc(db, 'userAssignments', openId), {
        submissionNote: note.trim(),
        submissionAudioUrl: submissionAudioUrl,
        status: 'submitted',
        submittedAt: serverTimestamp(),
      });
      close();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit.');
    } finally {
      setSaving(false);
    }
  };

  

  const shareSystem = async () => {
    try {
      if (!recordingUri) {
        Alert.alert('No recording', 'Record audio first.');
        return;
      }
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert('Sharing unavailable', 'System share is not available.');
        return;
      }
      await Sharing.shareAsync(recordingUri);
    } catch (e) {
      Alert.alert('Share Error', 'Unable to open share sheet.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>Assigned Practices</Text>

      <Text style={styles.section}>Assigned</Text>
      {assigned.length === 0 && <Text style={styles.empty}>No current assignments.</Text>}
      {assigned.map(i => (
        <TouchableOpacity key={i.id} style={styles.card} onPress={() => open(i.id)}>
          <View style={styles.dot(i.status)} />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.cardTitle}>{i.assignmentTitle ?? i.assignmentId}</Text>
            {i.assignmentDescription ? <Text style={styles.meta}>{i.assignmentDescription}</Text> : null}
          </View>
        </TouchableOpacity>
      ))}

      <Text style={styles.section}>Completed</Text>
      {completed.length === 0 && <Text style={styles.empty}>Nothing completed yet.</Text>}
      {completed.map(i => (
        <View key={i.id} style={[styles.card, i.status === 'feedback' && styles.cardGreen]}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={styles.dot(i.status)} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={styles.cardTitle}>{i.assignmentTitle ?? i.assignmentId}</Text>
                {i.assignmentDescription ? <Text style={styles.meta}>{i.assignmentDescription}</Text> : null}
              </View>
            </View>
            <Text style={styles.status}>{i.status}</Text>
          </View>
          {i.submissionAudioUrl ? (
            <Text style={{ color: '#555', marginTop: 6 }}>Audio submitted</Text>
          ) : null}
          {i.feedback ? (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Feedback</Text>
              <Text style={styles.feedbackText}>{i.feedback}</Text>
            </View>
          ) : null}
        </View>
      ))}

      <Modal visible={!!openId} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Submit Practice</Text>
            <TextInput
              style={styles.input}
              multiline
              placeholder="Add a short note about your submission (optional)"
              value={note}
              onChangeText={setNote}
            />
            <View style={{ height: 10 }} />
            {recording ? (
              <TouchableOpacity style={[styles.btn, styles.warn]} onPress={stopRecording}>
                <Text style={styles.btnText}>Stop Recording</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btn, styles.save]} onPress={startRecording}>
                <Text style={styles.btnText}>Start Recording</Text>
              </TouchableOpacity>
            )}
            {recordingUri ? (
              <View style={styles.rowBetween}>
                <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={isPlaying ? pause : play}>
                  <Text style={styles.btnText}>{isPlaying ? 'Pause' : 'Play'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={() => setRecordingUri(null)}>
                  <Text style={styles.btnText}>Remove Audio</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <View style={styles.rowBetween}>
              <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={close}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.secondary]} onPress={shareSystem}>
                <Text style={styles.btnText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.save]} onPress={submit} disabled={saving}>
                <Text style={styles.btnText}>{saving ? 'Submitting...' : 'Submit'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, paddingHorizontal: 0, paddingTop: 0 },
  section: { fontSize: 16, fontWeight: '600', marginTop: 12, marginBottom: 6 },
  empty: { color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardGreen: { borderColor: '#4CAF50' },
  cardTitle: { fontWeight: '700', marginLeft: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  status: { color: '#555' },
  dot: (status: string) => ({ width: 10, height: 10, borderRadius: 5, backgroundColor: status === 'feedback' ? '#4CAF50' : status === 'submitted' ? '#FF9800' : '#9E9E9E' }),
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { backgroundColor: '#fff', borderRadius: 12, padding: 16, width: '95%', maxWidth: 520 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 90, textAlignVertical: 'top' },
  btn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginTop: 10 },
  cancel: { backgroundColor: '#9e9e9e' },
  save: { backgroundColor: '#E20000' },
  secondary: { backgroundColor: '#6d6d6d' },
  warn: { backgroundColor: '#FF6B6B' },
  btnText: { color: '#fff', fontWeight: '700' },
  meta: { color: '#555' },
  feedbackBox: { marginTop: 8, padding: 10, backgroundColor: '#f4fff5', borderRadius: 8, borderWidth: 1, borderColor: '#e0f2e9' },
  feedbackTitle: { fontWeight: '700', marginBottom: 4, color: '#2e7d32' },
  feedbackText: { color: '#1b5e20' },
});
