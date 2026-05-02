import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============= BLUETOOTH SERVICE =============
export class BluetoothService {
  /**
   * bluetoothctl orqali juftlangan qurilmalarni aniqlash
   */
  static async getPairedDevices() {
    try {
      const { stdout } = await execAsync("bluetoothctl devices Paired");
      if (!stdout.trim()) return [];
      return stdout.split('\n')
        .filter(line => line.includes('Device'))
        .map(line => {
          const parts = line.trim().split(' ');
          return { mac: parts[1], name: parts.slice(2).join(' ') };
        });
    } catch (e) {
      return [];
    }
  }

  /**
   * Bluetooth qurilmalarni skanerlash (5 soniya)
   */
  static async scanDevices(): Promise<{ mac: string; name: string }[]> {
    try {
      // Scan yoqiladi, 5 soniya kutiladi, keyin natija olinadi
      await execAsync("bluetoothctl power on");
      
      // scan on, 5s kut, scan off
      await execAsync("timeout 5 bluetoothctl scan on || true");
      
      // Topilgan qurilmalarni olish
      const { stdout } = await execAsync("bluetoothctl devices");
      if (!stdout.trim()) return [];

      const devices = stdout.split('\n')
        .filter(line => line.includes('Device'))
        .map(line => {
          const parts = line.trim().split(' ');
          const mac = parts[1];
          const name = parts.slice(2).join(' ');
          return { mac, name };
        })
        .filter(d => d.mac && d.name && !d.name.startsWith('Device'));

      return devices;
    } catch (e) {
      console.error("Scan error:", e);
      return [];
    }
  }

  /**
   * Qurilmani juftlash (pair)
   */
  static async pairDevice(mac: string): Promise<string> {
    await execAsync("bluetoothctl power on");
    const { stdout } = await execAsync(`bluetoothctl pair ${mac}`);
    return stdout.trim();
  }

  /**
   * Qurilmaga ulanish
   */
  static async connectDevice(mac: string): Promise<string> {
    await execAsync("bluetoothctl power on");
    
    // Trust qilish (qayta-qayta so'ramaslik uchun)
    try { await execAsync(`bluetoothctl trust ${mac}`); } catch (e) {}
    
    const { stdout } = await execAsync(`bluetoothctl connect ${mac}`);
    return stdout.trim();
  }

  /**
   * Qurilmani uzish
   */
  static async disconnectDevice(mac: string): Promise<string> {
    const { stdout } = await execAsync(`bluetoothctl disconnect ${mac}`);
    return stdout.trim();
  }

  /**
   * Qurilmani o'chirish (remove)
   */
  static async removeDevice(mac: string): Promise<string> {
    try { await execAsync(`bluetoothctl disconnect ${mac}`); } catch (e) {}
    const { stdout } = await execAsync(`bluetoothctl remove ${mac}`);
    return stdout.trim();
  }

  /**
   * Qurilma ma'lumotini olish
   */
  static async getDeviceInfo(mac: string): Promise<Record<string, string>> {
    try {
      const { stdout } = await execAsync(`bluetoothctl info ${mac}`);
      const info: Record<string, string> = {};
      stdout.split('\n').forEach(line => {
        const match = line.match(/^\s+(.+?):\s+(.+)$/);
        if (match) {
          info[match[1].trim()] = match[2].trim();
        }
      });
      return info;
    } catch (e) {
      return {};
    }
  }
}

// ============= AUDIO SERVICE =============
export class AudioService {
  /**
   * PipeWire/PulseAudio sink-larini olish (Outputs)
   */
  static async getActiveSinks() {
    try {
      const { stdout } = await execAsync("pactl list short sinks");
      if (!stdout.trim()) return [];
      return stdout.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const parts = line.split('\t');
          return { id: parts[0], name: parts[1], driver: parts[2], state: parts[4] || 'UNKNOWN' };
        });
    } catch (e) {
      return [];
    }
  }

  /**
   * PipeWire/PulseAudio source-larini olish (Microphones/Inputs)
   */
  static async getActiveSources() {
    try {
      const { stdout } = await execAsync("pactl list short sources");
      if (!stdout.trim()) return [];
      return stdout.split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          const parts = line.split('\t');
          return { id: parts[0], name: parts[1], driver: parts[2], state: parts[4] || 'UNKNOWN' };
        });
    } catch (e) {
      return [];
    }
  }

  /**
   * Default sink nomini olish
   */
  static async getDefaultSink(): Promise<string> {
    try {
      const { stdout } = await execAsync("pactl get-default-sink");
      return stdout.trim();
    } catch (e) {
      return '';
    }
  }

  /**
   * Ovoz balandligini sozlash
   */
  static async setVolume(sinkName: string, volume: number) {
    await execAsync(`pactl set-sink-volume ${sinkName} ${volume}%`);
  }

  /**
   * Mute/Unmute
   */
  static async setMute(sinkName: string, isMuted: boolean) {
    await execAsync(`pactl set-sink-mute ${sinkName} ${isMuted ? '1' : '0'}`);
  }

  /**
   * Latency offset sozlash
   */
  static async setLatency(sinkName: string, latency: number) {
    try {
      // PipeWire/PulseAudio latency offset
      await execAsync(`pactl set-port-latency-offset ${sinkName} bluetooth-output ${latency * 1000}`);
    } catch (e) {
      console.log(`Latency offset o'rnatilmadi: ${sinkName} → ${latency}ms`);
    }
  }

  /**
   * Bir nechta sink-larni birlashtirish (Combined Sink)
   */
  static async createCombinedSink(slaves: string[]) {
    const slaveList = slaves.join(',');
    // Eskisini o'chirish
    try { await execAsync("pactl unload-module module-combine-sink"); } catch (e) {}
    
    // Yangisini yaratish
    const { stdout: moduleId } = await execAsync(
      `pactl load-module module-combine-sink sink_name=bluez_combined slaves=${slaveList} label="BlueSync Combined Output"`
    );
    
    // Default qilib belgilash (WirePlumber orqali)
    try {
      const { stdout: wpStatus } = await execAsync("wpctl status");
      const lines = wpStatus.split('\n');
      const combinedLine = lines.find(l => l.includes('bluez_combined'));
      if (combinedLine) {
        const id = combinedLine.match(/\d+/)?.[0];
        if (id) await execAsync(`wpctl set-default ${id}`);
      }
    } catch (e) {
      // wpctl mavjud emas — pactl orqali default qilamiz
      try { await execAsync("pactl set-default-sink bluez_combined"); } catch (e2) {}
    }

    return moduleId.trim();
  }

  /**
   * Routingni reset qilish
   */
  static async resetRouting() {
    try {
      await execAsync("pactl unload-module module-combine-sink");
    } catch (e) {}
  }
}
