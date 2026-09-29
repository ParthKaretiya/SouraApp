import React, { forwardRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { isMapLibreAvailable } from './isMapLibreAvailable';
import { FallbackCorridorMap } from './FallbackCorridorMap';
import type { RouteData } from '../../types/route';
import type { LiveDriverLocation } from './NativeMapLibreView';

export interface DriverMapViewProps {
  routeData: RouteData;
  liveLocation: LiveDriverLocation | null;
  simulatedPos: { longitude: number; latitude: number; stepIndex?: number; heading?: number } | null;
  isSimulating: boolean;
  isFollowingDriver?: boolean;
  onFollowChange?: (following: boolean) => void;
  selectedDestination?: [number, number] | null;
  onMapPress?: (coords: [number, number]) => void;
}

export interface DriverMapViewRef {
  easeTo: (center: [number, number], zoom: number) => void;
  centerOnDriver: () => void;
  centerOnRoute: () => void;
}

export const DriverMapView = forwardRef<DriverMapViewRef, DriverMapViewProps>(
  (props, ref) => {
    const hasNativeMapLibre = useMemo(() => isMapLibreAvailable(), []);

    if (!hasNativeMapLibre) {
      return (
        <View style={styles.container}>
          <FallbackCorridorMap
            routeData={props.routeData}
            liveLocation={props.liveLocation}
            simulatedPos={props.simulatedPos}
            isSimulating={props.isSimulating}
            selectedDestination={props.selectedDestination}
            onMapPress={props.onMapPress}
          />
        </View>
      );
    }

    // Lazy require to avoid triggering TurboModuleRegistry.getEnforcing in environments without native binary
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { NativeMapLibreView } = require('./NativeMapLibreView');
    return <NativeMapLibreView ref={ref} {...props} />;
  }
);

DriverMapView.displayName = 'DriverMapView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
