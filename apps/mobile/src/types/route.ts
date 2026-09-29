export interface RoutePoint {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
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
    coordinates: [number, number][]; // [longitude, latitude][]
  };
  steps: RouteManeuverStep[];
  safetyScore: number | null;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  accessibilityStatus: 'OPEN' | 'RESTRICTED' | 'CLOSED' | null;
  hazardAlert?: {
    severity: 'WARNING' | 'CRITICAL' | 'INFO';
    message: string;
    locationName: string;
  };
}
