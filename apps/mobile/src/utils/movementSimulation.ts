import { GUWAHATI_SHILLONG_ROUTE } from '../data/mockRoute';

/**
 * ISOLATED DEMO SIMULATION MODULE
 * 
 * NOTICE: This module is exclusively for demo movement preview.
 * It is completely isolated and can be safely deleted once full live
 * hardware telemetry replaces demo mode.
 */
export interface SimulatedPosition {
  longitude: number;
  latitude: number;
  stepIndex: number;
  heading: number;
  speedKmh: number;
  isSimulated: true;
}

export function calculateBearing(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const dLng = toRad(endLng - startLng);
  const lat1 = toRad(startLat);
  const lat2 = toRad(endLat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function getSimulatedCoordinate(
  step: number,
  customCoords?: [number, number][]
): SimulatedPosition {
  const coords = customCoords && customCoords.length > 0
    ? customCoords
    : GUWAHATI_SHILLONG_ROUTE.geometry.coordinates;
  const index = Math.min(Math.max(0, step), coords.length - 1);
  const [lng, lat] = coords[index];

  let heading = 0;
  if (index < coords.length - 1) {
    const [nextLng, nextLat] = coords[index + 1];
    heading = calculateBearing(lng, lat, nextLng, nextLat);
  } else if (index > 0) {
    const [prevLng, prevLat] = coords[index - 1];
    heading = calculateBearing(prevLng, prevLat, lng, lat);
  }

  return {
    longitude: lng,
    latitude: lat,
    stepIndex: index,
    heading: Math.round(heading),
    speedKmh: index === 0 ? 0 : 58,
    isSimulated: true,
  };
}
