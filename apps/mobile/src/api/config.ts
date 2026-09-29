import { Platform } from 'react-native';

/**
 * Global API Network Configuration
 * 
 * Android Emulator Note:
 * Android emulators cannot reach host machines via "localhost".
 * "http://10.0.2.2:3000" routes to the host development machine.
 * 
 * Physical Device Testing Note:
 * Set EXPO_PUBLIC_API_URL to your LAN IP, e.g. "http://192.168.1.100:3000".
 */
export const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  fallbackUrl: 'http://10.0.2.2:3000',
  timeoutMs: 5000,
};
