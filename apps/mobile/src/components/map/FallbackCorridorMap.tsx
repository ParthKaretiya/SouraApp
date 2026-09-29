import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import Svg, {
  Path,
  Circle,
  Rect,
  Line,
  G,
  Text as SvgText,
  Polygon,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors, spacing, radius, layout, shadows } from '../../theme';
import type { RouteData } from '../../types/route';

interface FallbackCorridorMapProps {
  routeData: RouteData;
  liveLocation: { latitude: number; longitude: number; heading?: number | null } | null;
  simulatedPos: { longitude: number; latitude: number; stepIndex?: number; heading?: number } | null;
  isSimulating: boolean;
  selectedDestination?: [number, number] | null;
  onMapPress?: (coords: [number, number]) => void;
}

export const FallbackCorridorMap: React.FC<FallbackCorridorMapProps> = ({
  routeData,
  liveLocation,
  simulatedPos,
  isSimulating,
  selectedDestination,
  onMapPress,
}) => {
  const [mapDimensions, setMapDimensions] = useState({
    width: Dimensions.get('window').width,
    height: 380,
  });

  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedHazardId, setSelectedHazardId] = useState<string | null>(null);

  const currentStep = isSimulating && simulatedPos?.stepIndex ? simulatedPos.stepIndex : 0;
  const coords = useMemo(() => routeData?.geometry?.coordinates || [], [routeData]);

  // Handle container layout for dynamic responsive SVG sizing
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setMapDimensions({ width, height: Math.max(height, 340) });
    }
  };

  // Derive Bounding Box of the Highway Corridor with Margin
  const bounds = useMemo(() => {
    if (!coords || coords.length === 0) {
      return { minLng: 91.73, maxLng: 91.89, minLat: 25.57, maxLat: 26.15 };
    }

    let minLng = Infinity;
    let maxLng = -Infinity;
    let minLat = Infinity;
    let maxLat = -Infinity;

    for (const [lng, lat] of coords) {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    const padLng = Math.max((maxLng - minLng) * 0.14, 0.015);
    const padLat = Math.max((maxLat - minLat) * 0.14, 0.015);

    return {
      minLng: minLng - padLng,
      maxLng: maxLng + padLng,
      minLat: minLat - padLat,
      maxLat: maxLat + padLat,
    };
  }, [coords]);

  // Coordinate Projection: [lng, lat] -> [x, y] in screen space
  const project = useMemo(() => {
    return (lng: number, lat: number): [number, number] => {
      const { minLng, maxLng, minLat, maxLat } = bounds;
      const spanLng = maxLng - minLng || 0.01;
      const spanLat = maxLat - minLat || 0.01;

      const normX = (lng - minLng) / spanLng;
      // In cartography, latitude increases northwards (upwards on screen), so invert Y
      const normY = 1 - (lat - minLat) / spanLat;

      const centerX = mapDimensions.width / 2;
      const centerY = mapDimensions.height / 2;

      // Apply zoom and pan transformation around center
      const rawX = normX * mapDimensions.width;
      const rawY = normY * mapDimensions.height;

      const screenX = centerX + (rawX - centerX) * zoomLevel + panOffset.x;
      const screenY = centerY + (rawY - centerY) * zoomLevel + panOffset.y;

      return [screenX, screenY];
    };
  }, [bounds, mapDimensions, zoomLevel, panOffset]);

  // Construct SVG Path String for the continuous highway route
  const { fullPathD, traveledPathD, remainingPathD } = useMemo(() => {
    if (!coords || coords.length === 0) {
      return { fullPathD: '', traveledPathD: '', remainingPathD: '' };
    }

    const projectedPoints = coords.map(([lng, lat]) => project(lng, lat));

    // Full path string
    const fullD = projectedPoints.reduce(
      (acc, [x, y], idx) => (idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`),
      ''
    );

    // Split into traveled vs remaining based on simulation index
    const splitIdx = Math.min(Math.max(currentStep, 0), projectedPoints.length - 1);

    const traveledD = projectedPoints
      .slice(0, splitIdx + 1)
      .reduce((acc, [x, y], idx) => (idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`), '');

    const remainingD = projectedPoints
      .slice(splitIdx)
      .reduce((acc, [x, y], idx) => (idx === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)} ${y.toFixed(1)}`), '');

    return {
      fullPathD: fullD,
      traveledPathD: traveledD,
      remainingPathD: remainingD,
    };
  }, [coords, project, currentStep]);

  // Origin and Destination Screen Positions
  const originPos = useMemo(() => {
    const oCoord = routeData?.origin?.coordinates || coords[0] || [91.7362, 26.1118];
    return project(oCoord[0], oCoord[1]);
  }, [routeData, coords, project]);

  const destPos = useMemo(() => {
    const dCoord = routeData?.destination?.coordinates || coords[coords.length - 1] || [91.8833, 25.5788];
    return project(dCoord[0], dCoord[1]);
  }, [routeData, coords, project]);

  // Vehicle Live/Simulated Screen Position & Angle
  const vehicleState = useMemo(() => {
    let lng = coords[0]?.[0] || 91.7362;
    let lat = coords[0]?.[1] || 26.1118;
    let heading = 0;

    if (simulatedPos) {
      lng = simulatedPos.longitude;
      lat = simulatedPos.latitude;
      if (simulatedPos.heading != null) {
        heading = simulatedPos.heading;
      }
    } else if (liveLocation) {
      lng = liveLocation.longitude;
      lat = liveLocation.latitude;
      if (liveLocation.heading != null) {
        heading = liveLocation.heading;
      }
    }

    const [vx, vy] = project(lng, lat);

    // If heading is 0, estimate angle from next coordinate along path
    if (heading === 0 && coords.length > 1) {
      const nextIdx = Math.min(currentStep + 1, coords.length - 1);
      const [nx, ny] = project(coords[nextIdx][0], coords[nextIdx][1]);
      const dx = nx - vx;
      const dy = ny - vy;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        heading = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
      }
    }

    return { x: vx, y: vy, heading, lng, lat };
  }, [coords, simulatedPos, liveLocation, project, currentStep]);

  // Hazard markers projected on route
  const hazardMarkers = useMemo(() => {
    const list: Array<{ id: string; label: string; x: number; y: number; type: string; severity: string }> = [];

    if (routeData.hazardAlert) {
      // Place hazard at approx 45% along the corridor
      const midIdx = Math.floor(coords.length * 0.45);
      const coord = coords[midIdx] || coords[0];
      if (coord) {
        const [hx, hy] = project(coord[0], coord[1]);
        list.push({
          id: 'alert-primary',
          label: routeData.hazardAlert.locationName || 'Hazard Zone',
          x: hx,
          y: hy,
          type: 'LANDSLIDE',
          severity: routeData.hazardAlert.severity,
        });
      }
    }

    return list;
  }, [routeData, coords, project]);

  // Waypoints for text timeline view
  const waypoints = useMemo(() => {
    if (routeData.steps && routeData.steps.length > 0) {
      let cumulativeDist = 0;
      return routeData.steps.map((step, idx) => {
        cumulativeDist += step.distanceMeters / 1000;
        const isOrigin = idx === 0;
        const isDest = idx === routeData.steps.length - 1;
        const icon = isOrigin ? '📍' : isDest ? '🏁' : step.maneuverType.includes('turn') ? '🔀' : '🛣️';
        const coordIdx = Math.min(
          Math.floor((idx / routeData.steps.length) * coords.length),
          coords.length - 1
        );
        return {
          name: isOrigin
            ? `${routeData.origin.name} (Origin)`
            : isDest
            ? `${routeData.destination.name} (Dest)`
            : step.roadName || step.instruction,
          km: `${cumulativeDist.toFixed(1)} km`,
          elev: `${150 + idx * 85}m`,
          icon,
          step: idx,
          coords: coords[coordIdx] || routeData.origin.coordinates,
        };
      });
    }

    return [
      {
        name: `${routeData.origin.name} (Origin)`,
        km: '0.0 km',
        elev: '120m',
        icon: '📍',
        step: 0,
        coords: routeData.origin.coordinates,
      },
      {
        name: `${routeData.destination.name} (Dest)`,
        km: `${routeData.distanceKm} km`,
        elev: '450m',
        icon: '🏁',
        step: 1,
        coords: routeData.destination.coordinates,
      },
    ];
  }, [routeData, coords]);

  // Controls Handlers
  const handleZoomIn = () => setZoomLevel((z) => Math.min(z + 0.35, 2.8));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(z - 0.35, 0.75));
  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
  };
  const handleCenterOnVehicle = () => {
    const centerX = mapDimensions.width / 2;
    const centerY = mapDimensions.height / 2;
    const { minLng, maxLng, minLat, maxLat } = bounds;
    const normX = (vehicleState.lng - minLng) / (maxLng - minLng || 0.01);
    const normY = 1 - (vehicleState.lat - minLat) / (maxLat - minLat || 0.01);
    const rawX = normX * mapDimensions.width;
    const rawY = normY * mapDimensions.height;

    setPanOffset({
      x: centerX - rawX * zoomLevel,
      y: centerY - rawY * zoomLevel,
    });
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {/* TOP FLOATING TELEMETRY CHIP */}
      <View style={styles.topTelemetryBar} pointerEvents="box-none">
        <View style={styles.telemetryChip}>
          <View style={styles.livePulseDot} />
          <Text style={styles.telemetryChipText}>
            {vehicleState.lat.toFixed(4)}° N, {vehicleState.lng.toFixed(4)}° E
          </Text>
        </View>

        <View style={styles.speedChip}>
          <Text style={styles.speedNumber}>{isSimulating ? '48' : '0'}</Text>
          <Text style={styles.speedUnit}>KM/H</Text>
        </View>
      </View>

      {/* FLOATING ZOOM / CAMERA MAP CONTROLS */}
      <View style={styles.floatingControlsContainer}>
        <TouchableOpacity style={styles.controlBtn} onPress={handleZoomIn} activeOpacity={0.8}>
          <Text style={styles.controlBtnText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleZoomOut} activeOpacity={0.8}>
          <Text style={styles.controlBtnText}>－</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleCenterOnVehicle} activeOpacity={0.8}>
          <Text style={styles.controlBtnIcon}>🎯</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleResetView} activeOpacity={0.8}>
          <Text style={styles.controlBtnIcon}>🗺️</Text>
        </TouchableOpacity>
      </View>

      {/* VIEW MODE TOGGLE BUTTON */}
      <View style={styles.viewModeToggleRow}>
        <TouchableOpacity
          style={[styles.togglePill, viewMode === 'map' && styles.togglePillActive]}
          onPress={() => setViewMode('map')}
          activeOpacity={0.8}
        >
          <Text style={[styles.togglePillText, viewMode === 'map' && styles.togglePillTextActive]}>
            🗺️ Real Highway Map
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.togglePill, viewMode === 'list' && styles.togglePillActive]}
          onPress={() => setViewMode('list')}
          activeOpacity={0.8}
        >
          <Text style={[styles.togglePillText, viewMode === 'list' && styles.togglePillTextActive]}>
            📋 Turn Waypoints
          </Text>
        </TouchableOpacity>
      </View>

      {/* MAIN VIEW: 2D HIGH-PRECISION VECTOR MAP */}
      {viewMode === 'map' ? (
        <View style={styles.svgMapWrapper}>
          <Svg
            width={mapDimensions.width}
            height={mapDimensions.height}
            style={styles.svgCanvas}
          >
            <Defs>
              <LinearGradient id="bgGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#0B132B" stopOpacity="1" />
                <Stop offset="1" stopColor="#1C2541" stopOpacity="1" />
              </LinearGradient>
              <LinearGradient id="roadGlow" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#38BDF8" stopOpacity="1" />
                <Stop offset="1" stopColor="#0284C7" stopOpacity="1" />
              </LinearGradient>
            </Defs>

            {/* DARK NAVIGATION MAP BACKGROUND */}
            <Rect width={mapDimensions.width} height={mapDimensions.height} fill="url(#bgGradient)" />

            {/* TOPOGRAPHIC GRID LINES */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio) => (
              <G key={`grid-${ratio}`}>
                <Line
                  x1={0}
                  y1={mapDimensions.height * ratio}
                  x2={mapDimensions.width}
                  y2={mapDimensions.height * ratio}
                  stroke="#1E293B"
                  strokeWidth={0.8}
                  strokeDasharray="4, 8"
                />
                <Line
                  x1={mapDimensions.width * ratio}
                  y1={0}
                  x2={mapDimensions.width * ratio}
                  y2={mapDimensions.height}
                  stroke="#1E293B"
                  strokeWidth={0.8}
                  strokeDasharray="4, 8"
                />
              </G>
            ))}

            {/* HIGHWAY BASEMENT / ROAD BED CASING (DEEP NAVY) */}
            {fullPathD ? (
              <Path
                d={fullPathD}
                fill="none"
                stroke="#0F172A"
                strokeWidth={14}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
            ) : null}

            {/* ROAD BORDER OUTLINE (BLUE CASING) */}
            {fullPathD ? (
              <Path
                d={fullPathD}
                fill="none"
                stroke="#1E3A8A"
                strokeWidth={10}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* ACTIVE VIBRANT HIGHWAY PATH (ELECTRIC CYAN) */}
            {remainingPathD ? (
              <Path
                d={remainingPathD}
                fill="none"
                stroke="url(#roadGlow)"
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : fullPathD ? (
              <Path
                d={fullPathD}
                fill="none"
                stroke="url(#roadGlow)"
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* TRAVELED ROAD PROGRESSION (EMERALD/MUTED) */}
            {traveledPathD && isSimulating ? (
              <Path
                d={traveledPathD}
                fill="none"
                stroke="#10B981"
                strokeWidth={5.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
            ) : null}

            {/* CENTER HIGHWAY DASHED DIVIDER */}
            {fullPathD ? (
              <Path
                d={fullPathD}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={1.2}
                strokeDasharray="5, 6"
                opacity={0.85}
              />
            ) : null}

            {/* HAZARD WARNING BADGES ALONG THE HIGHWAY */}
            {hazardMarkers.map((h) => (
              <G key={h.id}>
                <Circle cx={h.x} cy={h.y} r={14} fill="#EF4444" opacity={0.25} />
                <Circle cx={h.x} cy={h.y} r={8} fill="#DC2626" stroke="#FFFFFF" strokeWidth={1.5} />
                <SvgText
                  x={h.x}
                  y={h.y + 3.5}
                  fontSize={8}
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  ⚠️
                </SvgText>
                <Rect
                  x={h.x - 38}
                  y={h.y - 24}
                  width={76}
                  height={15}
                  rx={4}
                  fill="rgba(15, 23, 42, 0.85)"
                  stroke="#DC2626"
                  strokeWidth={1}
                />
                <SvgText
                  x={h.x}
                  y={h.y - 13}
                  fontSize={8}
                  fontWeight="bold"
                  fill="#FCA5A5"
                  textAnchor="middle"
                >
                  {h.label}
                </SvgText>
              </G>
            ))}

            {/* ORIGIN PIN (GREEN) */}
            <G>
              <Circle cx={originPos[0]} cy={originPos[1]} r={12} fill="#10B981" opacity={0.25} />
              <Circle cx={originPos[0]} cy={originPos[1]} r={6.5} fill="#10B981" stroke="#FFFFFF" strokeWidth={1.8} />
              <Rect
                x={originPos[0] - 44}
                y={originPos[1] - 25}
                width={88}
                height={16}
                rx={4}
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#10B981"
                strokeWidth={1}
              />
              <SvgText
                x={originPos[0]}
                y={originPos[1] - 14}
                fontSize={8.5}
                fontWeight="bold"
                fill="#A7F3D0"
                textAnchor="middle"
              >
                📍 {routeData.origin.name}
              </SvgText>
            </G>

            {/* DESTINATION PIN (CHECKERED / RED) */}
            <G>
              <Circle cx={destPos[0]} cy={destPos[1]} r={14} fill="#EF4444" opacity={0.25} />
              <Circle cx={destPos[0]} cy={destPos[1]} r={7.5} fill="#DC2626" stroke="#FFFFFF" strokeWidth={2} />
              <Rect
                x={destPos[0] - 44}
                y={destPos[1] - 25}
                width={88}
                height={16}
                rx={4}
                fill="rgba(15, 23, 42, 0.9)"
                stroke="#DC2626"
                strokeWidth={1}
              />
              <SvgText
                x={destPos[0]}
                y={destPos[1] - 14}
                fontSize={8.5}
                fontWeight="bold"
                fill="#FECACA"
                textAnchor="middle"
              >
                🏁 {routeData.destination.name}
              </SvgText>
            </G>

            {/* REAL-TIME VEHICLE NAVIGATION CURSOR */}
            <G
              transform={`rotate(${vehicleState.heading}, ${vehicleState.x}, ${vehicleState.y})`}
            >
              {/* HEADLIGHT BEAM CONE */}
              <Polygon
                points={`${vehicleState.x},${vehicleState.y} ${vehicleState.x - 18},${vehicleState.y - 48} ${vehicleState.x + 18},${vehicleState.y - 48}`}
                fill="#FEF08A"
                opacity={0.35}
              />

              {/* PULSING RADAR RING */}
              <Circle cx={vehicleState.x} cy={vehicleState.y} r={16} fill="#F59E0B" opacity={0.22} />
              <Circle cx={vehicleState.x} cy={vehicleState.y} r={10} fill="#F59E0B" opacity={0.4} />

              {/* VEHICLE CHEVRON ARROW BODY */}
              <Polygon
                points={`${vehicleState.x},${vehicleState.y - 12} ${vehicleState.x + 9},${vehicleState.y + 9} ${vehicleState.x},${vehicleState.y + 4} ${vehicleState.x - 9},${vehicleState.y + 9}`}
                fill="#FBBF24"
                stroke="#FFFFFF"
                strokeWidth={1.8}
              />
            </G>
          </Svg>

          {/* BOTTOM CORRIDOR SUMMARY OVERLAY */}
          <View style={styles.corridorBottomOverlay}>
            <View style={styles.corridorOverlayLeft}>
              <Text style={styles.overlayCorridorName} numberOfLines={1}>
                {routeData.corridorName}
              </Text>
              <Text style={styles.overlaySub}>
                {routeData.origin.name} → {routeData.destination.name}
              </Text>
            </View>
            <View style={styles.overlayMetricsBadge}>
              <Text style={styles.overlayKm}>{routeData.distanceKm} km</Text>
              <Text style={styles.overlayTime}>{routeData.durationMinutes} min</Text>
            </View>
          </View>
        </View>
      ) : (
        /* ALTERNATIVE VIEW: TURN-BY-TURN WAYPOINT LIST */
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.corridorCard}>
            <View style={styles.corridorHeader}>
              <Text style={styles.corridorTitle}>{routeData.corridorName}</Text>
              <View style={styles.corridorTag}>
                <Text style={styles.corridorTagText}>
                  {routeData.distanceKm} km • {routeData.durationMinutes} min
                </Text>
              </View>
            </View>

            <View style={styles.waypointsList}>
              {waypoints.map((wp, idx) => {
                const isPassed = currentStep >= wp.step;
                const isCurrent =
                  currentStep >= wp.step &&
                  (idx === waypoints.length - 1 || currentStep < waypoints[idx + 1].step);

                return (
                  <TouchableOpacity
                    key={wp.name + idx}
                    style={[styles.waypointRow, isCurrent && styles.waypointRowCurrent]}
                    onPress={() => onMapPress?.(wp.coords)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.leftCol}>
                      <View
                        style={[
                          styles.nodeCircle,
                          isPassed && styles.nodePassed,
                          isCurrent && styles.nodeCurrent,
                        ]}
                      >
                        <Text style={styles.nodeText}>{isCurrent ? '⛟' : wp.icon}</Text>
                      </View>
                      {idx < waypoints.length - 1 && (
                        <View style={[styles.timelineTrack, isPassed && styles.trackPassed]} />
                      )}
                    </View>

                    <View style={[styles.rightCol, isCurrent && styles.rightColCurrent]}>
                      <View style={styles.waypointMain}>
                        <Text style={[styles.waypointName, isCurrent && styles.waypointNameCurrent]}>
                          {wp.name}
                        </Text>
                        {isCurrent && (
                          <View style={styles.currentBadge}>
                            <Text style={styles.currentBadgeText}>Vehicle</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.waypointMeta}>
                        <Text style={styles.metaKm}>{wp.km}</Text>
                        <Text style={styles.metaDot}>•</Text>
                        <Text style={styles.metaElev}>Elev: {wp.elev}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B132B',
  },
  topTelemetryBar: {
    position: 'absolute',
    top: 10,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  telemetryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#334155',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  telemetryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  speedChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#F59E0B',
    gap: 3,
  },
  speedNumber: {
    fontSize: 14,
    fontWeight: '900',
    color: '#F59E0B',
  },
  speedUnit: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FCD34D',
  },
  floatingControlsContainer: {
    position: 'absolute',
    right: 12,
    top: 55,
    zIndex: 20,
    gap: 8,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  controlBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#38BDF8',
    lineHeight: 20,
  },
  controlBtnIcon: {
    fontSize: 14,
  },
  viewModeToggleRow: {
    position: 'absolute',
    bottom: 60,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 20,
  },
  togglePill: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#334155',
  },
  togglePillActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  togglePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  togglePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  svgMapWrapper: {
    flex: 1,
    position: 'relative',
  },
  svgCanvas: {
    flex: 1,
  },
  corridorBottomOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  corridorOverlayLeft: {
    flex: 1,
    marginRight: 10,
  },
  overlayCorridorName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  overlaySub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  overlayMetricsBadge: {
    alignItems: 'flex-end',
  },
  overlayKm: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38BDF8',
  },
  overlayTime: {
    fontSize: 10,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  scrollArea: {
    flex: 1,
    marginTop: 50,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  corridorCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  corridorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  corridorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  corridorTag: {
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  corridorTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brandDark,
  },
  waypointsList: {
    paddingVertical: spacing.xs,
  },
  waypointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  waypointRowCurrent: {
    backgroundColor: 'rgba(248, 203, 70, 0.1)',
    borderRadius: radius.sm,
  },
  leftCol: {
    alignItems: 'center',
    width: 36,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  nodePassed: {
    borderColor: colors.functionalGreen,
    backgroundColor: '#ECFDF5',
  },
  nodeCurrent: {
    borderColor: colors.brandDark,
    backgroundColor: colors.brand,
    transform: [{ scale: 1.15 }],
  },
  nodeText: {
    fontSize: 13,
  },
  timelineTrack: {
    width: 2,
    height: 38,
    backgroundColor: colors.borderSubtle,
    marginVertical: 2,
  },
  trackPassed: {
    backgroundColor: colors.functionalGreen,
  },
  rightCol: {
    flex: 1,
    paddingLeft: spacing.sm,
    paddingBottom: spacing.lg,
  },
  rightColCurrent: {
    padding: spacing.xs,
  },
  waypointMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  waypointName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  waypointNameCurrent: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  currentBadge: {
    backgroundColor: colors.brand,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textDark,
  },
  waypointMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaKm: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metaDot: {
    color: colors.textMuted,
  },
  metaElev: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
