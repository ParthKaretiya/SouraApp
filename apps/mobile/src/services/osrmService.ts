import type { RouteData, RouteManeuverStep } from '../types/route';

interface OsrmStep {
  name: string;
  maneuver: {
    type: string;
    modifier?: string;
    location: [number, number];
  };
  distance: number;
  duration: number;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  legs: Array<{
    steps: OsrmStep[];
  }>;
}

interface OsrmApiResponse {
  code: string;
  routes?: OsrmRoute[];
  message?: string;
}

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

function formatInstruction(type: string, modifier: string | undefined, roadName: string): string {
  const road = roadName && roadName.trim().length > 0 ? roadName.trim() : 'the road';
  if (type === 'depart') return `Head out onto ${road}`;
  if (type === 'arrive') return 'Arrive at destination';
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

/**
 * Direct HTTPS client to public OpenStreetMap OSRM routing engine.
 * Provides live road calculations for any origin/destination pairs across India.
 */
export async function fetchLiveOsrmRoute(
  origin: [number, number],
  destination: [number, number],
  originName = 'Origin',
  destName = 'Destination'
): Promise<RouteData | null> {
  const [origLng, origLat] = origin;
  const [destLng, destLat] = destination;
  const url = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?overview=full&geometries=geojson&steps=true`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7500);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const data = (await res.json()) as OsrmApiResponse;
    if (data.code !== 'Ok' || !data.routes || !data.routes[0]) return null;

    const r = data.routes[0];
    const steps: RouteManeuverStep[] = (r.legs[0]?.steps || []).map((step, idx) => ({
      id: `step-${idx + 1}`,
      instruction: formatInstruction(step.maneuver.type, step.maneuver.modifier, step.name),
      distanceMeters: Math.round(step.distance),
      roadName: step.name || 'Highway',
      maneuverType: mapManeuverType(step.maneuver.type, step.maneuver.modifier),
    }));

    return {
      id: `route-osrm-${Date.now()}`,
      corridorName: `${originName} → ${destName}`,
      origin: {
        name: originName,
        coordinates: origin,
      },
      destination: {
        name: destName,
        coordinates: destination,
      },
      distanceKm: Math.round((r.distance / 1000) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(r.duration / 60)),
      geometry: r.geometry,
      steps,
      safetyScore: 92,
      riskLevel: 'LOW',
      accessibilityStatus: 'OPEN',
    };
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
