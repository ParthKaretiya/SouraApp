import type { RouteManeuverStep } from '../types/route';

const R_EARTH_METERS = 6371000;

/**
 * Computes great-circle distance between two [longitude, latitude] points in meters.
 */
export function haversineDistanceMeters(
  p1: [number, number],
  p2: [number, number]
): number {
  const [lon1, lat1] = p1;
  const [lon2, lat2] = p2;

  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R_EARTH_METERS * c;
}

/**
 * Finds the index of the closest segment [i, i+1] on the route LineString.
 */
export function findClosestSegmentIndex(
  point: [number, number],
  lineCoordinates: [number, number][]
): number {
  if (!lineCoordinates || lineCoordinates.length < 2) return 0;

  let minDistance = Infinity;
  let closestIndex = 0;

  for (let i = 0; i < lineCoordinates.length - 1; i++) {
    const pA = lineCoordinates[i];
    const pB = lineCoordinates[i + 1];

    // Midpoint distance approximation for fast segment indexing
    const midX = (pA[0] + pB[0]) / 2;
    const midY = (pA[1] + pB[1]) / 2;
    const dist = haversineDistanceMeters(point, [midX, midY]);

    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = i;
    }
  }

  return closestIndex;
}

/**
 * Calculates remaining route distance in kilometers from driver's current position to the destination.
 * Accumulates remaining segment length plus all future segments along the route.
 */
export function calculateRemainingDistanceKm(
  currentCoords: [number, number],
  lineCoordinates: [number, number][]
): number {
  if (!lineCoordinates || lineCoordinates.length < 2) return 0;

  const closestIdx = findClosestSegmentIndex(currentCoords, lineCoordinates);

  // Distance from current position to end of the current segment
  let totalMeters = haversineDistanceMeters(currentCoords, lineCoordinates[closestIdx + 1]);

  // Sum lengths of all remaining segments
  for (let i = closestIdx + 1; i < lineCoordinates.length - 1; i++) {
    totalMeters += haversineDistanceMeters(lineCoordinates[i], lineCoordinates[i + 1]);
  }

  return Math.max(0, Math.round((totalMeters / 1000) * 10) / 10);
}

/**
 * Computes remaining travel duration in minutes based on real remaining distance.
 */
export function calculateRemainingDurationMinutes(
  remainingDistanceKm: number,
  initialDistanceKm: number,
  initialDurationMinutes: number
): number {
  if (initialDistanceKm <= 0 || remainingDistanceKm <= 0) return 0;

  const ratio = remainingDistanceKm / initialDistanceKm;
  return Math.max(1, Math.round(ratio * initialDurationMinutes));
}

/**
 * Resolves the upcoming maneuver step along the route based on driver's progress.
 */
export function resolveUpcomingManeuver(
  currentCoords: [number, number],
  steps: RouteManeuverStep[],
  lineCoordinates: [number, number][]
): { step: RouteManeuverStep | null; stepIndex: number; distanceMeters: number } {
  if (!steps || steps.length === 0) {
    return { step: null, stepIndex: 0, distanceMeters: 0 };
  }

  if (steps.length === 1) {
    const dist = haversineDistanceMeters(
      currentCoords,
      lineCoordinates[lineCoordinates.length - 1] || currentCoords
    );
    return { step: steps[0], stepIndex: 0, distanceMeters: Math.round(dist) };
  }

  // Calculate approximate segment index of vehicle
  const totalSegments = Math.max(1, lineCoordinates.length - 1);
  const currentSegment = findClosestSegmentIndex(currentCoords, lineCoordinates);
  const progressRatio = currentSegment / totalSegments;

  // Map progress ratio to steps array
  const stepIndex = Math.min(
    steps.length - 1,
    Math.floor(progressRatio * steps.length)
  );

  const activeStep = steps[stepIndex] || steps[0];
  const dist = activeStep.distanceMeters || Math.round(haversineDistanceMeters(currentCoords, lineCoordinates[lineCoordinates.length - 1]));

  return {
    step: activeStep,
    stepIndex,
    distanceMeters: dist,
  };
}
