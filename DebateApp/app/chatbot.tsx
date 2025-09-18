import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../constants/firebase';
import { launchConversation, sendTextMessage, extractTextFromTraces } from '../constants/voiceflow';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
};

export default function ChatbotScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [botTyping, setBotTyping] = useState(false);
  

  useEffect(() => {
    // Ensure TTS can play in iOS silent mode
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUserId(null);
        setMessages([{ id: 'not-signed-in', role: 'system', text: 'Please sign in to chat.' }]);
        return;
      }
      const id = u.uid;
      setUserId(id);
      setBusy(true);
      try {
        const traces = await launchConversation(id);
        const parts = extractTextFromTraces(traces);
        if (parts.length > 0) {
          setMessages((prev) => [
            ...prev,
            { id: `bot-launch-${Date.now()}`, role: 'bot', text: parts.join('\n') },
          ]);
        }
      } catch (e: any) {
        Alert.alert('Chat Error', e?.message || 'Failed to start conversation');
      } finally {
        setBusy(false);
      }
    });
    return () => unsub();
  }, []);

  const send = async () => {
    if (!userId) return;
    const text = input.trim();
    if (!text) return;
    setInput('');
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setBusy(true);
    setBotTyping(true);
    try {
      const traces = await sendTextMessage(userId, text);
      const parts = extractTextFromTraces(traces);
      const botText = parts.length > 0 ? parts.join('\n') : '(no reply)';
      const botMsg: ChatMessage = { id: `b-${Date.now()}`, role: 'bot', text: botText };
      setMessages((prev) => [...prev, botMsg]);
      // TTS for bot reply (optional)
      if (ttsEnabled && botText && botText !== '(no reply)') {
        try { Speech.speak(botText, { language: 'en-US' }); } catch {}
      }
    } catch (e: any) {
      Alert.alert('Chat Error', e?.message || 'Failed to send message');
    } finally {
      setBusy(false);
      setBotTyping(false);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    }
  };

  // Mic feature removed

  // (mic feature removed)

  return (
    <>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : item.role === 'bot' ? styles.botBubble : styles.systemBubble]}>
              <Text style={styles.bubbleText}>{item.text}</Text>
            </View>
          )}
          contentContainerStyle={{ padding: 16 }}
        />
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.ttsToggle, ttsEnabled ? styles.ttsOn : styles.ttsOff]}
            onPress={() => setTtsEnabled(v => !v)}
            disabled={busy}
          >
            <Text style={styles.sendText}>{ttsEnabled ? '🔊' : '🔈'}</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: '#fff', backgroundColor: '#222' }]}
            placeholder="Type your message"
            value={input}
            onChangeText={setInput}
            editable={!busy}
            returnKeyType="send"
            onSubmitEditing={send}
          />
          {/* Mic button removed */}
          <TouchableOpacity style={styles.sendButton} onPress={send} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
          </TouchableOpacity>
        </View>
        {botTyping ? (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <Text style={{ color: '#666' }}>Assistant is typing…</Text>
          </View>
        ) : null}
        </View>
      </KeyboardAvoidingView>
      {/* mic UI removed */}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  bubble: {
    maxWidth: '85%',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#E20000',
  },
  botBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#eee',
  },
  bubbleText: { color: '#222' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#E20000',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  ttsToggle: {
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginRight: 8,
  },
  ttsOn: { backgroundColor: '#2e7d32' },
  ttsOff: { backgroundColor: '#777' },
  
  sendText: { color: '#fff', fontWeight: '700' },
});

// Mic modal removed


