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

    let isConnected = false;
    let profileName = 'Bluetooth LE';
    
    try {
      const server = await device.gatt?.connect();
      isConnected = true;

      try {
        const deviceInfoService = await server?.getPrimaryService('device_information');
        const modelChar = await deviceInfoService?.getCharacteristic('model_number_string');
        const modelValue = await modelChar?.readValue();
        if (modelValue) {
          profileName = new TextDecoder().decode(modelValue);
        }
      } catch (e) {}
    } catch (e) {
      isConnected = false;
    }

    const newDevice: Device = {
      id: `web_bt_${device.id || Date.now()}`,
      name: device.name || 'Noma\'lum Qurilma',
      status: isConnected ? 'connected' : 'disconnected',
      profile: profileName,
      sink: null,
      active: isConnected,
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
