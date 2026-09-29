export interface RoutePoint {
  name: string;
  coordinates: [number, number]; // [lng, lat]
}

export interface RouteManeuverStep {
  id: string;
  instruction: string;
  distanceMeters: number;
  roadName: string;
  maneuverType: 'straight' | 'turn-left' | 'turn-right' | 'keep-right' | 'keep-left' | 'destination';
}

export interface RouteData {
  id: string;
  corridorName: string;
  origin: RoutePoint;
  destination: RoutePoint;
  distanceKm: number;
  durationMinutes: number;
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  steps: RouteManeuverStep[];
  safetyScore: null;
  riskLevel: null;
  accessibilityStatus: null;
}

export interface RerouteResponse {
  rerouteRecommended: boolean;
  reason?: string;
  currentRoute: RouteData;
  recommendedRoute?: RouteData;
  metrics?: {
    timeSavedMinutes: number;
    riskReductionPercent: number;
  };
}

/**
 * Minimal in-memory route registry to associate route IDs with their metadata
 * and destination coordinates for server-side dynamic rerouting.
 */
class RouteRegistry {
  private routes = new Map<string, RouteData>();

  constructor() {
    // Pre-seed known corridor route ID for compatibility
    this.routes.set('route-ghy-shl-nh6', {
      id: 'route-ghy-shl-nh6',
      corridorName: 'NH-6 Highway Corridor (Guwahati → Shillong)',
      origin: {
        name: 'Guwahati (ISBT)',
        coordinates: [91.7362, 26.1118],
      },
      destination: {
        name: 'Shillong (Police Bazar)',
        coordinates: [91.8833, 25.5788],
      },
      distanceKm: 96,
      durationMinutes: 71,
      geometry: {
        type: 'LineString',
        coordinates: [
          [91.7362, 26.1118],
          [91.8833, 25.5788],
        ],
      },
      steps: [],
      safetyScore: null,
      riskLevel: null,
      accessibilityStatus: null,
    });
  }

  public saveRoute(route: RouteData): void {
    this.routes.set(route.id, route);
  }

  public getRoute(id: string): RouteData | undefined {
    return this.routes.get(id);
  }

  public hasRoute(id: string): boolean {
    return this.routes.has(id);
  }
}

export const routeRegistry = new RouteRegistry();
