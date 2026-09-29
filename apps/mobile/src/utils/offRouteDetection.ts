/**
 * Off-Route Detection Utility for SauraRoute Driver (Level C.7)
 * 
 * Computes cross-track distance between the driver's current geographic coordinate
 * [longitude, latitude] and the active route GeoJSON LineString coordinates.
 * 
 * Architecture specification:
 * - Cross-track distance > 50 meters
 * - Exactly 3 consecutive GPS ticks required before triggering reroute
 * - Counter resets immediately when vehicle returns within threshold
 * - Concurrency control prevents duplicate simultaneous reroute requests
 * - Cooldown prevents API thrashing while vehicle remains off-route
 */

export const OFF_ROUTE_THRESHOLD_METERS = 50;
export const OFF_ROUTE_CONSECUTIVE_TICKS_REQUIRED = 3;
export const OFF_ROUTE_COOLDOWN_MS = 10000;

const R_EARTH_METERS = 6371000;

/**
 * Computes shortest distance from point P to line segment AB on Earth's surface
 * using local equirectangular Cartesian projection.
 * Coordinates are [longitude, latitude].
 */
export function distanceToSegmentMeters(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  const midLatRad = ((ay + by) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(midLatRad);

  const xB = (bx - ax) * (Math.PI / 180) * R_EARTH_METERS * cosLat;
  const yB = (by - ay) * (Math.PI / 180) * R_EARTH_METERS;
  const xP = (px - ax) * (Math.PI / 180) * R_EARTH_METERS * cosLat;
  const yP = (py - ay) * (Math.PI / 180) * R_EARTH_METERS;

  const lenSq = xB * xB + yB * yB;
  if (lenSq === 0) {
    return Math.hypot(xP, yP);
  }

  // Orthogonal projection scalar clamped to segment [0, 1]
  const t = Math.max(0, Math.min(1, (xP * xB + yP * yB) / lenSq));
  const projX = t * xB;
  const projY = t * yB;

  return Math.hypot(xP - projX, yP - projY);
}

/**
 * Calculates minimum cross-track distance in meters from a point [lng, lat]
 * to a multi-segment LineString coordinate array [[lng, lat], ...].
 */
export function calculateCrossTrackDistanceMeters(
  point: [number, number],
  lineCoordinates: [number, number][]
): number {
  if (!lineCoordinates || lineCoordinates.length === 0) {
    return Infinity;
  }

  if (lineCoordinates.length === 1) {
    return distanceToSegmentMeters(
      point[0], point[1],
      lineCoordinates[0][0], lineCoordinates[0][1],
      lineCoordinates[0][0], lineCoordinates[0][1]
    );
  }

  let minDistance = Infinity;
  const numSegments = lineCoordinates.length - 1;

  for (let i = 0; i < numSegments; i++) {
    const d = distanceToSegmentMeters(
      point[0], point[1],
      lineCoordinates[i][0], lineCoordinates[i][1],
      lineCoordinates[i + 1][0], lineCoordinates[i + 1][1]
    );
    if (d < minDistance) {
      minDistance = d;
      if (minDistance === 0) break;
    }
  }

  return minDistance;
}

export interface OffRouteEvaluationResult {
  distanceMeters: number;
  isOffRoute: boolean;
  consecutiveOffRouteTicks: number;
  shouldTriggerReroute: boolean;
}

/**
 * State machine managing consecutive off-route ticks, concurrency gating,
 * and rate-limiting cooldowns for reroute triggering.
 */
export class OffRouteDetector {
  private consecutiveOffRouteTicks = 0;
  private isRerouting = false;
  private lastRerouteTime = 0;

  constructor(
    private readonly thresholdMeters: number = OFF_ROUTE_THRESHOLD_METERS,
    private readonly requiredTicks: number = OFF_ROUTE_CONSECUTIVE_TICKS_REQUIRED,
    private readonly cooldownMs: number = OFF_ROUTE_COOLDOWN_MS
  ) {}

  /**
   * Processes a GPS reading against active route coordinates.
   */
  public evaluatePosition(
    currentCoords: [number, number],
    routeCoordinates: [number, number][]
  ): OffRouteEvaluationResult {
    const distanceMeters = calculateCrossTrackDistanceMeters(currentCoords, routeCoordinates);
    const isOffRoute = distanceMeters > this.thresholdMeters;

    if (isOffRoute) {
      this.consecutiveOffRouteTicks += 1;
    } else {
      // Reset counter immediately when driver returns to within threshold
      this.consecutiveOffRouteTicks = 0;
    }

    const now = Date.now();
    const hasCooledDown = now - this.lastRerouteTime >= this.cooldownMs;

    const shouldTriggerReroute =
      this.consecutiveOffRouteTicks >= this.requiredTicks &&
      !this.isRerouting &&
      hasCooledDown;

    if (shouldTriggerReroute) {
      this.isRerouting = true;
      this.lastRerouteTime = now;
    }

    return {
      distanceMeters,
      isOffRoute,
      consecutiveOffRouteTicks: this.consecutiveOffRouteTicks,
      shouldTriggerReroute,
    };
  }

  /**
   * Marks successful reroute completion: resets counters and records timestamp.
   */
  public onRerouteSuccess(): void {
    this.consecutiveOffRouteTicks = 0;
    this.isRerouting = false;
    this.lastRerouteTime = Date.now();
  }

  /**
   * Marks reroute failure: clears in-flight lock to allow future retries.
   */
  public onRerouteFailure(): void {
    this.isRerouting = false;
    this.consecutiveOffRouteTicks = 0;
  }

  /**
   * Resets internal detector state (e.g., when route is changed or destination updated).
   */
  public reset(): void {
    this.consecutiveOffRouteTicks = 0;
    this.isRerouting = false;
  }

  public getConsecutiveTicks(): number {
    return this.consecutiveOffRouteTicks;
  }

  public getIsRerouting(): boolean {
    return this.isRerouting;
  }
}
