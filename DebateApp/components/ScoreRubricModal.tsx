import React, { useMemo, useState } from 'react';
import { Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

export type RubricItem = {
  key: string;
  label: string;
  max: number; // allocated points
};

export type RubricResult = {
  breakdown: Record<string, number>;
  total: number;
};

export default function ScoreRubricModal({
  visible,
  onClose,
  onSubmit,
  rubric,
  title = 'Self Review',
  onPlay,
  onReset,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (result: RubricResult) => void;
  rubric: RubricItem[];
  title?: string;
  onPlay?: () => void;
  onReset?: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  const totalMax = useMemo(() => rubric.reduce((s, r) => s + r.max, 0), [rubric]);
  const total = useMemo(() =>
    rubric.reduce((s, r) => s + Math.min(Number(values[r.key] ?? 0) || 0, r.max), 0)
  , [rubric, values]);

  const handleChange = (key: string, v: string) => {
    const num = Number(v.replace(/[^0-9]/g, ''));
    setValues(prev => ({ ...prev, [key]: String(isNaN(num) ? '' : num) }));
  };

  const handleSubmit = () => {
    const breakdown: Record<string, number> = {};
    rubric.forEach(r => {
      const n = Math.min(Number(values[r.key] ?? 0) || 0, r.max);
      breakdown[r.key] = n;
    });
    onSubmit({ breakdown, total });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>Max {totalMax} pts • Current {total} / {totalMax}</Text>
          <ScrollView style={{ width: '100%' }}>
            {rubric.map(item => (
              <View key={item.key} style={styles.row}>
                <Text style={styles.label}>{item.label} ({item.max})</Text>
                <TextInput
                  keyboardType="number-pad"
                  style={styles.input}
                  placeholder={`0 - ${item.max}`}
                  value={values[item.key] ?? ''}
                  onChangeText={(v) => handleChange(item.key, v)}
                />
              </View>
            ))}
          </ScrollView>
          <View style={styles.actions}>
            {onPlay && (
              <TouchableOpacity style={[styles.btn, styles.neutral]} onPress={onPlay}>
                <Text style={styles.btnText}>Preview</Text>
              </TouchableOpacity>
            )}
            {onReset && (
              <TouchableOpacity style={[styles.btn, styles.neutral]} onPress={onReset}>
                <Text style={styles.btnText}>Reset</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.btn, styles.cancel]} onPress={onClose}>
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.save]} onPress={handleSubmit}>
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  container: { backgroundColor: '#fff', borderRadius: 12, width: '95%', maxWidth: 520, padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { color: '#555', marginTop: 4, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 6 },
  label: { flex: 1, marginRight: 12, fontSize: 16, color: '#222' },
  input: { width: 100, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, textAlign: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 12 },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, marginLeft: 8, marginTop: 8 },
  cancel: { backgroundColor: '#9e9e9e' },
  neutral: { backgroundColor: '#546e7a' },
  save: { backgroundColor: '#E20000' },
  btnText: { color: '#fff', fontWeight: '700' },
});
