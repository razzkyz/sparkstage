import { useState, useRef, useCallback } from 'react';

type ConnectionType = 'bluetooth' | 'usb' | null;

export function useThermalPrinter() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType>(null);
  const [error, setError] = useState<string | null>(null);

  // References to keep the active connection objects
  const bluetoothDeviceRef = useRef<any>(null);
  const bluetoothCharacteristicRef = useRef<any>(null);
  const serialPortRef = useRef<any>(null);

  /**
   * Connect to printer via USB (Web Serial API)
   * Ideal for laptop development or fixed POS terminals
   */
  const connectUSB = useCallback(async () => {
    try {
      setError(null);
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API tidak didukung di browser ini.');
      }

      // @ts-ignore - Web Serial API type
      const port = await navigator.serial.requestPort();
      
      // Standard baud rate for ESC/POS USB usually 9600 or 115200.
      await port.open({ baudRate: 9600 });
      
      serialPortRef.current = port;
      setConnectionType('usb');
      setIsConnected(true);
    } catch (err: any) {
      console.error('USB Connect Error:', err);
      setError(err.message || 'Gagal terhubung ke printer USB');
      setIsConnected(false);
    }
  }, []);

  /**
   * Connect to printer via Bluetooth (Web Bluetooth API)
   * Ideal for Mobile / Tablet POS
   */
  const connectBluetooth = useCallback(async () => {
    try {
      setError(null);
      if (!('bluetooth' in navigator)) {
        throw new Error('Web Bluetooth API tidak didukung di browser ini.');
      }

      // @ts-ignore - Web Bluetooth API type
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        // Common ESC/POS Printer Service UUIDs
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Generik printer
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Alternatif EPPOS
        ]
      });

      if (!device.gatt) {
        throw new Error('Bluetooth GATT tidak didukung pada perangkat ini.');
      }
      const server = await device.gatt.connect();
      
      // Try to find the correct service and write characteristic dynamically
      const services = await server.getPrimaryServices();
      let writeCharacteristic = null;

      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        }
        if (writeCharacteristic) break;
      }

      if (!writeCharacteristic) {
        throw new Error('Tidak menemukan kapabilitas tulis (Write) pada printer Bluetooth ini.');
      }

      bluetoothDeviceRef.current = device;
      bluetoothCharacteristicRef.current = writeCharacteristic;

      // Handle disconnect event natively
      device.addEventListener('gattserverdisconnected', () => {
        setIsConnected(false);
        setConnectionType(null);
        bluetoothDeviceRef.current = null;
        bluetoothCharacteristicRef.current = null;
      });

      setConnectionType('bluetooth');
      setIsConnected(true);
    } catch (err: any) {
      console.error('Bluetooth Connect Error:', err);
      setError(err.message || 'Gagal terhubung ke printer Bluetooth');
      setIsConnected(false);
    }
  }, []);

  /**
   * Disconnect from current printer
   */
  const disconnect = useCallback(async () => {
    try {
      if (connectionType === 'bluetooth' && bluetoothDeviceRef.current) {
        bluetoothDeviceRef.current.gatt.disconnect();
      } else if (connectionType === 'usb' && serialPortRef.current) {
        await serialPortRef.current.close();
      }
    } catch (e) {
      console.error('Error on disconnect:', e);
    } finally {
      setIsConnected(false);
      setConnectionType(null);
      bluetoothDeviceRef.current = null;
      bluetoothCharacteristicRef.current = null;
      serialPortRef.current = null;
    }
  }, [connectionType]);

  /**
   * Print logic: Receives Uint8Array (from EscPosBuilder) and sends it over active connection
   */
  const print = useCallback(async (data: Uint8Array) => {
    if (!isConnected) {
      setError('Printer belum terhubung.');
      return;
    }

    setIsPrinting(true);
    setError(null);

    try {
      if (connectionType === 'usb' && serialPortRef.current) {
        const writer = serialPortRef.current.writable.getWriter();
        await writer.write(data);
        writer.releaseLock();
      } 
      else if (connectionType === 'bluetooth' && bluetoothCharacteristicRef.current) {
        // Bluetooth LE usually has a MTU (Maximum Transmission Unit) limit per write (often 512 bytes or smaller).
        // We split the data into chunks to prevent "Data too long" errors.
        const CHUNK_SIZE = 512;
        for (let i = 0; i < data.length; i += CHUNK_SIZE) {
          const chunk = data.slice(i, i + CHUNK_SIZE);
          if (bluetoothCharacteristicRef.current.properties.writeWithoutResponse) {
            await bluetoothCharacteristicRef.current.writeValueWithoutResponse(chunk);
          } else {
            await bluetoothCharacteristicRef.current.writeValue(chunk);
          }
          // Small delay between chunks to let printer buffer process
          await new Promise(resolve => setTimeout(resolve, 50)); 
        }
      }
    } catch (err: any) {
      console.error('Printing Error:', err);
      setError(err.message || 'Gagal mengirim data ke printer');
      throw err;
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectionType]);

  return {
    isConnected,
    isPrinting,
    connectionType,
    error,
    connectUSB,
    connectBluetooth,
    disconnect,
    print
  };
}
