import { LucideIcon } from 'lucide-react';

export interface Device {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'pairing';
  profile: string;
  sink: string | null;
  active: boolean;
  type: 'sink' | 'source';
  volume: number;
  latency_ms: number;
  muted?: boolean;
}

export interface AudioState {
  defaultSink: string;
  combinedStatus: 'active' | 'inactive';
  latency: number;
  syncStatus: 'synced' | 'drifting' | 'unknown';
}
