/**
 * Cetak struk ke printer thermal Bluetooth (Web Bluetooth API).
 * Cocok untuk Chrome/Edge di HTTPS atau localhost. Printer harus mendukung BLE UART (banyak merek ESC/POS BT).
 */

type TxChar = BluetoothRemoteGATTCharacteristic | null;

let gatt: BluetoothRemoteGATTServer | null = null;
let txChar: TxChar = null;

const COMMON_UART = {
  nordic: { service: '6e400001-b5a3-f393-e0a9-e50e24dcca9e', tx: '6e400002-b5a3-f393-e0a9-e50e24dcca9e' },
  feitianlike: { service: '0000ffe0-0000-1000-8000-00805f9b34fb', tx: '0000ffe1-0000-1000-8000-00805f9b34fb' },
} as const;

export function isWebBluetoothAvailable(): boolean {
  return typeof navigator !== 'undefined' && !!navigator.bluetooth && window.isSecureContext;
}

export function isBluetoothPrinterConnected(): boolean {
  return !!gatt?.connected && !!txChar;
}

export async function disconnectBluetoothPrinter(): Promise<void> {
  try {
    if (gatt?.connected) await gatt.disconnect();
  } catch {
    /* ignore */
  }
  gatt = null;
  txChar = null;
}

async function pickTxCharacteristic(server: BluetoothRemoteGATTServer): Promise<BluetoothRemoteGATTCharacteristic | null> {
  for (const u of Object.values(COMMON_UART)) {
    try {
      const svc = await server.getPrimaryService(u.service);
      const ch = await svc.getCharacteristic(u.tx);
      return ch;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Minta pengguna memilih printer dari dialog sistem. */
export async function connectBluetoothPrinter(): Promise<void> {
  if (!isWebBluetoothAvailable()) {
    throw new Error('Web Bluetooth tidak tersedia (gunakan Chrome/Edge, HTTPS, dan hidupkan Bluetooth).');
  }

  const device = await navigator.bluetooth.requestDevice({
    acceptAllDevices: true,
    optionalServices: [
      COMMON_UART.nordic.service,
      COMMON_UART.feitianlike.service,
    ],
  });

  const server = await device.gatt?.connect();
  if (!server) throw new Error('Gagal menyambung GATT.');

  const ch = await pickTxCharacteristic(server);
  if (!ch) {
    await server.disconnect();
    throw new Error('Karakteristik tulis UART tidak ditemukan. Coba printer lain yang pakai BLE serial.');
  }

  gatt = server;
  txChar = ch;

  device.addEventListener('gattserverdisconnected', () => {
    gatt = null;
    txChar = null;
  });
}

/** Kirim teks UTF-8 + ESC @ (init) ringan. Tanpa library ESC/POS penuh. */
export async function printTextToBluetooth(text: string): Promise<void> {
  if (!txChar) throw new Error('Printer belum terhubung. Buka Pengaturan POS → Hubungkan printer.');

  const encoder = new TextEncoder();
  const init = new Uint8Array([0x1b, 0x40]);
  const body = encoder.encode(text + '\n\n\n');
  const payload = new Uint8Array(init.length + body.length);
  payload.set(init, 0);
  payload.set(body, init.length);

  const chunk = 100;
  for (let i = 0; i < payload.length; i += chunk) {
    const slice = payload.slice(i, i + chunk);
    await txChar.writeValue(slice);
  }
}
