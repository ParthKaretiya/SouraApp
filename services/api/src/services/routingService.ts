export interface ManeuverStep {
  id: string;
  instruction: string;
  distanceMeters: number;
  roadName: string;
  maneuverType: 'straight' | 'turn-left' | 'turn-right' | 'keep-left' | 'keep-right' | 'destination';
}

export interface CalculatedRoute {
  distanceKm: number;
  durationMinutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][]; // [longitude, latitude][]
  };
  steps: ManeuverStep[];
}

interface OsrmStep {
  name: string;
  distance: number;
  duration: number;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  legs: {
    steps: OsrmStep[];
  }[];
}

interface OsrmResponse {
  code: string;
  message?: string;
  routes?: OsrmRoute[];
}

const DEFAULT_OSRM_URL = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';
const TIMEOUT_MS = 10000;

/**
 * Maps OSRM maneuver type and modifier to SauraRoute standard maneuver types.
 */
function mapManeuverType(
  type: string,
  modifier?: string
): 'straight' | 'turn-left' | 'turn-right' | 'keep-left' | 'keep-right' | 'destination' {
  if (type === 'arrive') return 'destination';

  const mod = (modifier || '').toLowerCase();
  if (mod.includes('left')) {
    if (type === 'fork' || type === 'continue') return 'keep-left';
    return 'turn-left';
  }
  if (mod.includes('right')) {
    if (type === 'fork' || type === 'continue') return 'keep-right';
    return 'turn-right';
  }
  return 'straight';
}

/**
 * Formats a driver-friendly instruction from maneuver metadata.
 */
function formatInstruction(
  type: string,
  modifier: string | undefined,
  roadName: string
): string {
  const road = roadName && roadName.trim().length > 0 ? roadName.trim() : 'the road';

  if (type === 'depart') {
    return `Head out onto ${road}`;
  }
  if (type === 'arrive') {
    return 'Arrive at destination';
  }
  if (type === 'fork') {
    return modifier?.includes('left')
      ? `Keep left at fork onto ${road}`
      : `Keep right at fork onto ${road}`;
  }
  if (modifier?.includes('left')) {
    if (modifier.includes('slight')) return `Bear slightly left onto ${road}`;
    if (modifier.includes('sharp')) return `Sharp left turn onto ${road}`;
    return `Turn left onto ${road}`;
  }
  if (modifier?.includes('right')) {
    if (modifier.includes('slight')) return `Bear slightly right onto ${road}`;
    if (modifier.includes('sharp')) return `Sharp right turn onto ${road}`;
    return `Turn right onto ${road}`;
  }
  return `Continue straight on ${road}`;
}

export class RoutingService {
  private baseUrl: string;

  constructor(baseUrl = DEFAULT_OSRM_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  /**
   * Calculates a road-snapped route between arbitrary origin and destination coordinates
   * using the OpenStreetMap OSRM routing protocol.
   * 
   * @param origin [longitude, latitude]
   * @param destination [longitude, latitude]
   */
  public async calculateRoute(
    origin: [number, number],
    destination: [number, number]
  ): Promise<CalculatedRoute> {
    const [origLng, origLat] = origin;
    const [destLng, destLat] = destination;

    const url = `${this.baseUrl}/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SauraRouteBackend/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Routing provider responded with status ${response.status}`);
      }

      const data = (await response.json()) as OsrmResponse;

      if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
        throw new Error(`Routing engine returned code: ${data.code} (${data.message || 'No route found'})`);
      }

      const osrmRoute = data.routes[0];
      const rawSteps = osrmRoute.legs[0]?.steps || [];

      // Transform raw OSRM steps into typed RouteManeuverStep objects
      const steps: ManeuverStep[] = rawSteps.map((step, index) => {
        const roadName = step.name || '';
        const maneuverType = mapManeuverType(step.maneuver.type, step.maneuver.modifier);
        const instruction = formatInstruction(step.maneuver.type, step.maneuver.modifier, roadName);

        return {
          id: `step-${index + 1}`,
          instruction,
          distanceMeters: Math.round(step.distance),
          roadName: roadName || 'Highway',
          maneuverType,
        };
      });

      return {
        distanceKm: Math.round((osrmRoute.distance / 1000) * 10) / 10,
        durationMinutes: Math.max(1, Math.round(osrmRoute.duration / 60)),
        geometry: osrmRoute.geometry,
        steps,
      };
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        throw new Error(`Routing calculation failed: ${err.message}`);
      }
      throw new Error('Routing calculation failed with an unexpected error');
    }
  }
}

export const routingService = new RoutingService();
