import { Platform } from 'react-native';

type VoiceflowTrace = {
  type: string;
  payload?: any;
  message?: { content?: string };
  text?: string;
};

const DEFAULT_BASE_URL = 'https://general-runtime.voiceflow.com';

function getConfig() {
  const apiKey = process.env.EXPO_PUBLIC_VOICEFLOW_API_KEY;
  const versionId = process.env.EXPO_PUBLIC_VOICEFLOW_VERSION_ID; // optional depending on your Voiceflow project
  const baseUrl = process.env.EXPO_PUBLIC_VOICEFLOW_BASE_URL || DEFAULT_BASE_URL;
  if (!apiKey) {
    throw new Error('Missing EXPO_PUBLIC_VOICEFLOW_API_KEY');
  }
  return { apiKey, versionId, baseUrl };
}

function getCandidateUrls(userId: string): string[] {
  const { versionId, baseUrl } = getConfig();
  const b = baseUrl.replace(/\/$/, '');
  const urls: string[] = [];
  if (versionId) {
    // Documented versioned path
    urls.push(`${b}/state/${encodeURIComponent(versionId)}/user/${encodeURIComponent(userId)}/interact`);
    // Fallback (rare older variants)
    urls.push(`${b}/state/${encodeURIComponent(versionId)}/${encodeURIComponent(userId)}/interact`);
  } else {
    // Documented general runtime path
    urls.push(`${b}/state/user/${encodeURIComponent(userId)}/interact`);
    // Fallback (older doc variants)
    urls.push(`${b}/state/${encodeURIComponent(userId)}/interact`);
  }
  return urls;
}

async function postInteract(userId: string, body: any) {
  const { apiKey } = getConfig();
  const urls = getCandidateUrls(userId);
  let lastErrorText = '';
  let lastStatus = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          // Voiceflow Dialog Manager expects the raw key in Authorization (no Bearer)
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        // Keep body minimal to avoid 500s from unsupported config
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        lastStatus = res.status;
        lastErrorText = await res.text().catch(() => '');
        // try next candidate URL
        continue;
      }
      const data = await res.json();
      return data as { traces?: VoiceflowTrace[] } | VoiceflowTrace[];
    } catch (e: any) {
      lastErrorText = String(e?.message || e);
      // try next candidate URL
      continue;
    }
  }
  throw new Error(`Voiceflow request failed (${lastStatus || 'network'}): ${lastErrorText || 'No body'}`);
}

export async function launchConversation(userId: string) {
  // Many projects will start automatically; using explicit launch action for consistency
  const data = await postInteract(userId, { action: { type: 'launch' } });
  const traces = Array.isArray(data) ? data : data.traces || [];
  return traces as VoiceflowTrace[];
}

export async function sendTextMessage(userId: string, text: string) {
  const data = await postInteract(userId, { action: { type: 'text', payload: text } });
  const traces = Array.isArray(data) ? data : data.traces || [];
  return traces as VoiceflowTrace[];
}

export function extractTextFromTraces(traces: VoiceflowTrace[]): string[] {
  const outputs: string[] = [];
  for (const trace of traces) {
    // Common text surfaces
    if (trace.type === 'text' && typeof trace.payload?.message === 'string') {
      outputs.push(trace.payload.message);
      continue;
    }
    if (trace.type === 'speak' && typeof trace.payload?.message === 'string') {
      outputs.push(trace.payload.message);
      continue;
    }
    if (typeof trace.text === 'string' && trace.text.length > 0) {
      outputs.push(trace.text);
      continue;
    }
    if (typeof trace?.message?.content === 'string') {
      outputs.push(trace.message.content);
      continue;
    }
  }
  return outputs;
}


