import React, { useRef, useImperativeHandle, forwardRef, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  Map,
  Camera,
  type CameraRef,
  GeoJSONSource,
  Layer,
  Marker,
} from '@maplibre/maplibre-react-native';

import { colors } from '../../theme';
import { getActiveMapStyle } from './mapStyles';
import type { RouteData } from '../../types/route';

export interface LiveDriverLocation {
  latitude: number;
  longitude: number;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
}

export interface NativeMapLibreViewProps {
  routeData: RouteData;
  liveLocation: LiveDriverLocation | null;
  simulatedPos: { longitude: number; latitude: number; heading?: number } | null;
  isSimulating: boolean;
  isFollowingDriver?: boolean;
  onFollowChange?: (following: boolean) => void;
  selectedDestination?: [number, number] | null;
  onMapPress?: (coords: [number, number]) => void;
}

export interface NativeMapLibreViewRef {
  easeTo: (center: [number, number], zoom: number) => void;
  centerOnDriver: () => void;
  centerOnRoute: () => void;
}

function getRouteBounds(
  coordinates: [number, number][]
): [number, number, number, number] | null {
  if (!coordinates || coordinates.length === 0) return null;
  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }

  if (
    !Number.isFinite(minLng) ||
    !Number.isFinite(maxLng) ||
    !Number.isFinite(minLat) ||
    !Number.isFinite(maxLat)
  ) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}

export const NativeMapLibreView = forwardRef<NativeMapLibreViewRef, NativeMapLibreViewProps>(
  (
    {
      routeData,
      liveLocation,
      simulatedPos,
      isSimulating,
      isFollowingDriver = true,
      onFollowChange,
      selectedDestination,
      onMapPress,
    },
    ref
  ) => {
    const cameraRef = useRef<CameraRef>(null);
    const mapStyle = useMemo(() => getActiveMapStyle(), []);

    // Dynamic Route Bounds and Center Calculation
    const routeBounds = useMemo(
      () => getRouteBounds(routeData?.geometry?.coordinates || []),
      [routeData?.geometry?.coordinates]
    );

    const routeCenter = useMemo((): [number, number] => {
      if (routeBounds) {
        return [(routeBounds[0] + routeBounds[2]) / 2, (routeBounds[1] + routeBounds[3]) / 2];
      }
      return routeData?.origin?.coordinates || [72.5714, 23.0225];
    }, [routeBounds, routeData?.origin?.coordinates]);

    // Center camera on driver position
    const centerOnDriver = () => {
      if (liveLocation) {
        cameraRef.current?.easeTo({
          center: [liveLocation.longitude, liveLocation.latitude],
          zoom: 15.5,
          duration: 900,
        });
        onFollowChange?.(true);
      } else if (simulatedPos) {
        cameraRef.current?.easeTo({
          center: [simulatedPos.longitude, simulatedPos.latitude],
          zoom: 15.5,
          duration: 900,
        });
        onFollowChange?.(true);
      } else if (routeData?.origin?.coordinates) {
        cameraRef.current?.easeTo({
          center: routeData.origin.coordinates,
          zoom: 15.0,
          duration: 900,
        });
        onFollowChange?.(true);
      }
    };

    // Center camera on entire route with proper padding
    const centerOnRoute = () => {
      if (routeBounds) {
        cameraRef.current?.fitBounds(routeBounds, {
          padding: { top: 100, bottom: 200, left: 60, right: 60 },
          duration: 1000,
        });
      } else {
        cameraRef.current?.easeTo({
          center: routeCenter,
          zoom: 9.3,
          duration: 1000,
        });
      }
      onFollowChange?.(false);
    };

    useImperativeHandle(ref, () => ({
      easeTo: (center: [number, number], zoom: number) => {
        cameraRef.current?.easeTo({
          center,
          zoom,
          duration: 900,
        });
      },
      centerOnDriver,
      centerOnRoute,
    }));

    // Auto-fit bounds when a new route is loaded
    useEffect(() => {
      const bounds = routeBounds;
      if (!bounds) return;

      const timer = setTimeout(() => {
        if (!liveLocation || !isFollowingDriver) {
          cameraRef.current?.fitBounds(bounds, {
            padding: { top: 100, bottom: 200, left: 60, right: 60 },
            duration: 800,
          });
        }
      }, 350);

      return () => clearTimeout(timer);
    }, [routeData?.id, routeBounds]);

    // Dynamic Camera Follow: Smoothly track driver's real GPS updates when in follow mode
    useEffect(() => {
      if (!isFollowingDriver) return;

      if (liveLocation && !isSimulating) {
        cameraRef.current?.easeTo({
          center: [liveLocation.longitude, liveLocation.latitude],
          zoom: 15.5,
          duration: 800,
        });
      }
    }, [liveLocation?.latitude, liveLocation?.longitude, isFollowingDriver, isSimulating]);

    const originCoord = routeData.origin.coordinates;
    const destCoord = routeData.destination.coordinates;

    // Resolve heading angle for directional marker
    const driverHeading =
      isSimulating && simulatedPos?.heading != null
        ? simulatedPos.heading
        : liveLocation?.heading != null && liveLocation.heading >= 0
        ? liveLocation.heading
        : 0;

    // Handle user tap on MapLibre map to extract [longitude, latitude] coordinates
    const handleMapPress = (event: any) => {
      const rawLngLat =
        event?.nativeEvent?.lngLat ||
        event?.lngLat ||
        event?.geometry?.coordinates ||
        event?.nativeEvent?.geometry?.coordinates;
      if (
        Array.isArray(rawLngLat) &&
        rawLngLat.length >= 2 &&
        typeof rawLngLat[0] === 'number' &&
        typeof rawLngLat[1] === 'number' &&
        Number.isFinite(rawLngLat[0]) &&
        Number.isFinite(rawLngLat[1])
      ) {
        onMapPress?.([rawLngLat[0], rawLngLat[1]]);
      }
    };

    return (
      <View
        style={styles.container}
        onTouchStart={() => {
          if (isFollowingDriver) {
            onFollowChange?.(false);
          }
        }}
      >
        <Map
          style={styles.map}
          mapStyle={mapStyle}
          onPress={handleMapPress}
          logo={false}
          attribution={true}
          attributionPosition={{ bottom: 10, left: 10 }}
          compass={false}
          scaleBar={false}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: liveLocation
                ? [liveLocation.longitude, liveLocation.latitude]
                : routeCenter,
              zoom: liveLocation ? 14.5 : 8.5,
            }}
          />

          {/* REAL HIGHWAY CORRIDOR LINESTRING */}
          <GeoJSONSource
            key={`routeSource-${routeData.id}-${routeData.geometry.coordinates.length}`}
            id={`routeSource-${routeData.id}`}
            data={{
              type: 'Feature',
              properties: {},
              geometry: routeData.geometry,
            }}
          >
            {/* Deep navigation blue casing outline */}
            <Layer
              key={`routeLineOutline-${routeData.id}`}
              id={`routeLineOutline-${routeData.id}`}
              type="line"
              paint={{
                'line-color': '#1E40AF',
                'line-width': 8.5,
                'line-opacity': 0.92,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
            {/* Core vibrant navigation blue path */}
            <Layer
              key={`routeLine-${routeData.id}`}
              id={`routeLine-${routeData.id}`}
              type="line"
              paint={{
                'line-color': '#2563EB',
                'line-width': 5.0,
                'line-opacity': 1.0,
              }}
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
            />
          </GeoJSONSource>


          {/* ORIGIN MARKER */}
          <Marker id="originMarker" lngLat={originCoord}>
            <View style={styles.originMarkerBadge}>
              <View style={styles.originDot} />
              <View style={styles.markerLabelPill}>
                <Text style={styles.markerLabelText} numberOfLines={1}>
                  {routeData.origin.name}
                </Text>
              </View>
            </View>
          </Marker>

          {/* DESTINATION MARKER */}
          <Marker id="destMarker" lngLat={destCoord}>
            <View style={styles.destMarkerBadge}>
              <View style={styles.destPin}>
                <Text style={styles.destPinIcon}>⚑</Text>
              </View>
              <View style={styles.markerLabelPill}>
                <Text style={styles.markerLabelText} numberOfLines={1}>
                  {routeData.destination.name}
                </Text>
              </View>
            </View>
          </Marker>

          {/* DYNAMIC SELECTED DESTINATION DROP-PIN MARKER */}
          {selectedDestination && (
            <Marker id="selectedDestinationMarker" lngLat={selectedDestination}>
              <View style={styles.selectedMarkerBadge}>
                <View style={styles.selectedMarkerCircle}>
                  <Text style={styles.selectedMarkerIcon}>⚑</Text>
                </View>
                <View style={styles.selectedMarkerPill}>
                  <Text style={styles.selectedMarkerText}>
                    {`Target: ${selectedDestination[0].toFixed(4)}, ${selectedDestination[1].toFixed(4)}`}
                  </Text>
                </View>
              </View>
            </Marker>
          )}

          {/* REAL DRIVER VEHICLE POSITION MARKER (GOOGLE MAPS STYLE PUCK) */}
          {liveLocation && !isSimulating && (
            <Marker
              id="liveUserLocation"
              lngLat={[liveLocation.longitude, liveLocation.latitude]}
            >
              <View style={styles.vehicleMarkerContainer}>
                {/* Soft accuracy aura */}
                <View style={styles.vehiclePulsingAura} />
                {/* Directional navigation beam / core puck */}
                <View
                  style={[
                    styles.vehicleDirectionCore,
                    { transform: [{ rotate: `${driverHeading}deg` }] },
                  ]}
                >
                  <Text style={styles.vehicleArrowIcon}>▲</Text>
                </View>
              </View>
            </Marker>
          )}

          {/* SIMULATED MOVEMENT MARKER (DEMO MODE) */}
          {isSimulating && simulatedPos && (
            <Marker
              id="simulatedPosition"
              lngLat={[simulatedPos.longitude, simulatedPos.latitude]}
            >
              <View style={styles.vehicleMarkerContainer}>
                <View style={styles.vehiclePulsingAura} />
                <View
                  style={[
                    styles.vehicleDirectionCore,
                    { transform: [{ rotate: `${driverHeading}deg` }] },
                  ]}
                >
                  <Text style={styles.vehicleArrowIcon}>▲</Text>
                </View>
              </View>
            </Marker>
          )}
        </Map>
      </View>
    );
  }
);

NativeMapLibreView.displayName = 'NativeMapLibreView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
  },
  map: {
    flex: 1,
  },
  originMarkerBadge: {
    alignItems: 'center',
  },
  destMarkerBadge: {
    alignItems: 'center',
  },
  originDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0C831F',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  destPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 7,
  },
  destPinIcon: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  markerLabelPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  markerLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171717',
  },
  vehicleMarkerContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclePulsingAura: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(37, 99, 235, 0.16)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.35)',
  },
  vehicleDirectionCore: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 7,
  },
  vehicleArrowIcon: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  simulatedMarkerContainer: {
    alignItems: 'center',
  },
  simulatedBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F8CB46',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  simulatedIcon: {
    fontSize: 16,
    color: '#171717',
  },
  selectedMarkerBadge: {
    alignItems: 'center',
  },
  selectedMarkerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 7,
  },
  selectedMarkerIcon: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  selectedMarkerPill: {
    backgroundColor: '#FFFFFF',
    borderColor: '#DC2626',
    borderWidth: 1.5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  selectedMarkerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#171717',
    textAlign: 'center',
  },
});

