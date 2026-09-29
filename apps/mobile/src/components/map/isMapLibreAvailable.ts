import { TurboModuleRegistry } from 'react-native';

/**
 * Checks whether MapLibre's native TurboModules are registered in the current binary.
 * 
 * In standard Expo Go (Play Store), this returns false because MapLibre requires
 * custom native C++ code compiled into the binary.
 * 
 * In the custom Expo Dev Client APK (built via Gradle in Phase 1), this returns true.
 */
export function isMapLibreAvailable(): boolean {
  try {
    return TurboModuleRegistry.get('MLRNCameraModule') != null;
  } catch {
    return false;
  }
}
