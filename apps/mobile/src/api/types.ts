import type { RouteData } from '../types/route';

export type ApiErrorCode = 'NETWORK_ERROR' | 'TIMEOUT' | 'SERVER_ERROR' | 'NOT_FOUND' | 'UNKNOWN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  statusCode?: number;
}

export type ApiResponse<T> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: ApiError };

export interface HealthResponse {
  status: string;
  timestamp: string;
  uptimeSeconds?: number;
}

export interface WeatherResponse {
  temperatureCelsius: number;
  condition: string;
  humidityPercent: number;
  windSpeedKmh: number;
  precipitationMm: number;
  advisory?: string;
}

export interface RiskFactor {
  factor: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  description: string;
}

export interface RouteRiskResponse {
  routeId: string;
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  safetyScore: number; // 0 to 100
  riskFactors: RiskFactor[];
  lastUpdated: string;
}

export interface CorridorAccessibility {
  id: string;
  name: string;
  status: 'OPEN' | 'RESTRICTED' | 'CLOSED';
  reason?: string;
  affectedStretch?: string;
  reportedAt: string;
}

export interface AccessibilityResponse {
  corridors: CorridorAccessibility[];
}

export interface RoadAlert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  title: string;
  description: string;
  location: string;
  timestamp: string;
}

export interface AlertsResponse {
  alerts: RoadAlert[];
}

export interface IncidentReport {
  id?: string;
  type: 'Landslide' | 'Fallen Rocks' | 'Waterlogging' | 'Accident' | 'Road Obstruction';
  description: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  reportedAt?: string;
  status?: 'REPORTED' | 'VERIFIED' | 'RESOLVED';
}

export interface IncidentListResponse {
  incidents: IncidentReport[];
}

export interface RerouteRequest {
  currentRouteId: string;
  currentCoords: [number, number]; // [lng, lat]
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
