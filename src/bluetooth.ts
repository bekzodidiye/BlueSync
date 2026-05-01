/**
 * Web Bluetooth API orqali qurilmalarni topish va boshqarish
 */

import { Device } from './types';

// Web Bluetooth API mavjudligini tekshirish
export function isWebBluetoothSupported(): boolean {
  return !!(navigator as any).bluetooth;
}

// Bluetooth qurilmasini qidirish va ulash
export async function requestBluetoothDevice(): Promise<Device | null> {
  if (!isWebBluetoothSupported()) {
    throw new Error('WEB_BLUETOOTH_NOT_AVAILABLE');
  }

  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [
        'battery_service',
        'device_information',
        'generic_access',
        '0000110b-0000-1000-8000-00805f9b34fb',
        '0000110a-0000-1000-8000-00805f9b34fb',
        '0000111e-0000-1000-8000-00805f9b34fb',
        '00001108-0000-1000-8000-00805f9b34fb',
      ]
    });

    if (!device) return null;

    // Foydalanuvchi brauzer dialogdan qurilmani tanladi = qurilma "connected"
    let profileName = 'Bluetooth Audio';
    
    // GATT orqali qo'shimcha ma'lumot olishga harakat qilamiz (ixtiyoriy)
    try {
      const server = await device.gatt?.connect();
      try {
        const deviceInfoService = await server?.getPrimaryService('device_information');
        const modelChar = await deviceInfoService?.getCharacteristic('model_number_string');
        const modelValue = await modelChar?.readValue();
        if (modelValue) {
          profileName = new TextDecoder().decode(modelValue);
        }
      } catch (e) {
        // Model ma'lumoti yo'q — normal holat
      }
    } catch (e) {
      // Klassik BT qurilmalari (naushnik, kalonka) GATT ni qo'llamaydi — bu normal
    }

    const newDevice: Device = {
      id: `web_bt_${device.id || Date.now()}`,
      name: device.name || 'Noma\'lum Qurilma',
      status: 'connected',
      profile: profileName,
      sink: `web_sink_${device.id || Date.now()}`,
      active: true,
      type: 'sink',
      volume: 85,
      latency_ms: 0,
      muted: false,
    };

    device.addEventListener('gattserverdisconnected', () => {
      console.log(`${newDevice.name} uzildi`);
    });

    return newDevice;
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      return null;
    }
    throw error;
  }
}
