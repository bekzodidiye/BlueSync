/**
 * Server-side Bluetooth API orqali qurilmalarni boshqarish
 * bluetoothctl + pactl server tomonida ishlaydi
 */

import { Device } from './types';

const API_BASE = '';  // same origin

// ============= API HELPERS =============

async function apiGet(path: string) {
  const res = await fetch(`${API_BASE}${path}`);
  return res.json();
}

async function apiPost(path: string, body: any = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ============= BLUETOOTH FUNCTIONS =============

/**
 * Server salomatligini tekshirish (bluetoothctl mavjudmi?)
 */
export async function checkServerHealth(): Promise<boolean> {
  try {
    const data = await apiGet('/api/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * To'liq holat — barcha qurilmalar + audio
 */
export async function getFullStatus(): Promise<{
  devices: Device[];
  audio: { defaultSink: string; sinks: any[]; sources: any[] };
} | null> {
  try {
    const data = await apiGet('/api/status');
    if (!data.success) return null;
    return {
      devices: data.devices,
      audio: data.audio,
    };
  } catch {
    return null;
  }
}

/**
 * Bluetooth qurilmalarni skanerlash (server tomonida 5s)
 */
export async function scanDevices(): Promise<{ mac: string; name: string }[]> {
  try {
    const data = await apiGet('/api/bt/scan');
    return data.devices || [];
  } catch {
    return [];
  }
}

/**
 * Juftlangan qurilmalar ro'yxati
 */
export async function getPairedDevices(): Promise<{ mac: string; name: string }[]> {
  try {
    const data = await apiGet('/api/bt/paired');
    return data.devices || [];
  } catch {
    return [];
  }
}

/**
 * Qurilmani juftlash
 */
export async function pairDevice(mac: string): Promise<boolean> {
  const data = await apiPost('/api/bt/pair', { mac });
  return data.success;
}

/**
 * Qurilmaga ulanish
 */
export async function connectDevice(mac: string): Promise<boolean> {
  const data = await apiPost('/api/bt/connect', { mac });
  return data.success;
}

/**
 * Qurilmani uzish
 */
export async function disconnectDevice(mac: string): Promise<boolean> {
  const data = await apiPost('/api/bt/disconnect', { mac });
  return data.success;
}

/**
 * Qurilmani o'chirish
 */
export async function removeDevice(mac: string): Promise<boolean> {
  const data = await apiPost('/api/bt/remove', { mac });
  return data.success;
}

// ============= AUDIO FUNCTIONS =============

/**
 * Ovoz balandligini o'rnatish
 */
export async function setVolume(sinkName: string, volume: number): Promise<boolean> {
  const data = await apiPost('/api/audio/volume', { sinkName, volume });
  return data.success;
}

/**
 * Mute qilish
 */
export async function setMute(sinkName: string, muted: boolean): Promise<boolean> {
  const data = await apiPost('/api/audio/mute', { sinkName, muted });
  return data.success;
}

/**
 * Latency sozlash
 */
export async function setLatency(sinkName: string, latency: number): Promise<boolean> {
  const data = await apiPost('/api/audio/latency', { sinkName, latency });
  return data.success;
}

/**
 * Bir nechta qurilmani birlashtirish
 */
export async function combineSinks(sinks: string[]): Promise<boolean> {
  const data = await apiPost('/api/audio/combine', { sinks });
  return data.success;
}

/**
 * Routingni reset qilish
 */
export async function resetRouting(): Promise<boolean> {
  const data = await apiPost('/api/audio/reset');
  return data.success;
}
