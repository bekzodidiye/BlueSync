import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";

const execAsync = promisify(exec);

export interface DeviceInfo {
  id: string;
  name: string;
  status: 'connected' | 'disconnected';
  profile: string;
  sink: string | null;
  active: boolean;
  type: 'sink' | 'source';
  volume: number;
  latency_ms: number;
  muted: boolean;
}

export class BluetoothService {
  /**
   * bluetoothctl orqali ulangan qurilmalarni aniqlash
   */
  static async getPairedDevices() {
    try {
      const { stdout } = await execAsync("bluetoothctl --version").then(() => execAsync("bluetoothctl devices Paired")).catch(() => ({ stdout: "" }));
      if (!stdout) return [];
      return stdout.split('\n')
        .filter(line => line.includes('Device'))
        .map(line => {
          const parts = line.split(' ');
          return { mac: parts[1], name: parts.slice(2).join(' ') };
        });
    } catch (e) {
      // Silently return empty list if bluetoothctl fails
      return [];
    }
  }
}

export class AudioService {
  /**
   * PipeWire/PulseAudio sink-larini aniqlash (Outputs)
   */
  static async getActiveSinks() {
    try {
      const { stdout } = await execAsync("pactl --version").then(() => execAsync("pactl list short sinks")).catch(() => ({ stdout: "" }));
      if (!stdout) return [];
      return stdout.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const parts = line.split('\t');
          return { id: parts[0], name: parts[1], module: parts[2] };
        });
    } catch (e: any) {
      return [];
    }
  }

  /**
   * PipeWire/PulseAudio source-larini aniqlash (Microphones/Inputs)
   */
  static async getActiveSources() {
    try {
      const { stdout } = await execAsync("pactl --version").then(() => execAsync("pactl list short sources")).catch(() => ({ stdout: "" }));
      if (!stdout) return [];
      return stdout.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const parts = line.split('\t');
          return { id: parts[0], name: parts[1], module: parts[2] };
        });
    } catch (e: any) {
      return [];
    }
  }

  static async setVolume(sinkName: string, volume: number) {
    try {
      await execAsync(`pactl set-sink-volume ${sinkName} ${volume}%`);
    } catch (e) {}
  }

  static async setMute(sinkName: string, isMuted: boolean) {
    try {
      await execAsync(`pactl set-sink-mute ${sinkName} ${isMuted ? '1' : '0'}`);
    } catch (e) {}
  }

  static async setLatency(sinkName: string, latency: number) {
    // Note: this is a simplified mock for the latency offset
    // Real implementation varies depending on Sink type
    console.log(`Setting latency for ${sinkName} to ${latency}ms`);
  }

  /**
   * Bir nechta sinklarni birlashtirish
   */
  static async createCombinedSink(slaves: string[]) {
    const slaveList = slaves.join(',');
    // Eskisini o'chirish
    try { await execAsync("pactl unload-module module-combine-sink"); } catch (e) {}
    
    // Yangisini yuklash
    const { stdout: moduleId } = await execAsync(`pactl load-module module-combine-sink sink_name=bluez_combined slaves=${slaveList} label="BlueSync Combined Output"`);
    
    // Default qilib sozlash
    try {
        const { stdout: wpStatus } = await execAsync("wpctl status");
        const lines = wpStatus.split('\n');
        const combinedLine = lines.find(l => l.includes('bluez_combined'));
        if (combinedLine) {
            const id = combinedLine.match(/\d+/)?.[0];
            if (id) await execAsync(`wpctl set-default ${id}`);
        }
    } catch (e) {
        console.error("Failed to set default via wpctl:", e);
    }

    return moduleId.trim();
  }

  /**
   * Routingni reset qilish
   */
  static async resetRouting() {
    return await execAsync("pactl unload-module module-combine-sink");
  }
}
