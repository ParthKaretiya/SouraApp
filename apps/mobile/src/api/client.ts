import { API_CONFIG } from './config';
import type {
  ApiResponse,
  ApiError,
  HealthResponse,
  WeatherResponse,
  RouteRiskResponse,
  AccessibilityResponse,
  AlertsResponse,
  IncidentReport,
  IncidentListResponse,
  RerouteRequest,
  RerouteResponse,
} from './types';
import type { RouteData } from '../types/route';
import { GUWAHATI_SHILLONG_ROUTE, AHMEDABAD_KOTA_ROUTE } from '../data/mockRoute';
import { fetchLiveOsrmRoute } from '../services/osrmService';

class ApiClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
    this.timeoutMs = API_CONFIG.timeoutMs;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Internal request helper with strict timeout and typed error normalization
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMessage = `HTTP error ${response.status}`;
        try {
          const errorJson = await response.json();
          if (errorJson.message) errorMessage = errorJson.message;
        } catch {
          // ignore parsing error
        }

        const code =
          response.status === 404
            ? 'NOT_FOUND'
            : response.status >= 500
            ? 'SERVER_ERROR'
            : 'UNKNOWN';

        return {
          success: false,
          error: {
            code,
            message: errorMessage,
            statusCode: response.status,
          },
        };
      }

      const data = (await response.json()) as T;
      return { success: true, data };
    } catch (err: unknown) {
      clearTimeout(timeoutId);

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return {
            success: false,
            error: {
              code: 'TIMEOUT',
              message: `Request timed out after ${this.timeoutMs}ms`,
            },
          };
        }
        return {
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: `Network connection failed: ${err.message}`,
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'UNKNOWN',
          message: 'An unexpected network error occurred',
        },
      };
    }
  }

  // --- ENDPOINTS ---

  /** GET /api/health */
  public async getHealth(): Promise<ApiResponse<HealthResponse>> {
    const res = await this.request<HealthResponse>('/api/health');
    if (res.success) return res;

    // Fallback when server is not running
    return {
      success: true,
      data: {
        status: 'standby (offline mock)',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /** GET /api/weather */
  public async getWeather(lat = 26.1445, lng = 91.7362): Promise<ApiResponse<WeatherResponse>> {
    const res = await this.request<WeatherResponse>(`/api/weather?lat=${lat}&lng=${lng}`);
    if (res.success) return res;

    return {
      success: true,
      data: {
        temperatureCelsius: 24,
        condition: 'Partly Cloudy',
        humidityPercent: 78,
        windSpeedKmh: 12,
        precipitationMm: 0.2,
        advisory: 'Low visibility fog possible near high elevation (Nongpoh - Umsning)',
      },
    };
  }

  /** GET /api/routes or POST /api/routes/optimize */
  public async getOptimizedRoute(
    origin: [number, number] = [91.7362, 26.1445],
    destination: [number, number] = [91.8833, 25.5788]
  ): Promise<ApiResponse<RouteData>> {
    const isAhmedabadKota =
      (Math.abs(origin[0] - 72.57) < 1.0 || Math.abs(destination[0] - 75.86) < 1.0) ||
      (Math.abs(origin[0] - 75.86) < 1.0 || Math.abs(destination[0] - 72.57) < 1.0);

    // 1. Attempt connection to primary backend server
    const res = await this.request<RouteData>('/api/routes/optimize', {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    });

    if (res.success && res.data) return res;

    // 2. Direct live OSRM fallback over HTTPS for real road paths anywhere
    try {
      const liveOsrm = await fetchLiveOsrmRoute(
        origin,
        destination,
        isAhmedabadKota ? 'Ahmedabad (Ashram Road)' : 'Start Point',
        isAhmedabadKota ? 'Kota (Rajasthan)' : 'Destination'
      );
      if (liveOsrm) {
        return {
          success: true,
          data: liveOsrm,
        };
      }
    } catch {
      // ignore and proceed to pre-computed routes
    }

    // 3. Resilient fallback to pre-computed routes
    if (isAhmedabadKota) {
      return {
        success: true,
        data: AHMEDABAD_KOTA_ROUTE,
      };
    }

    return {
      success: true,
      data: GUWAHATI_SHILLONG_ROUTE,
    };
  }

  /** POST /api/routes/reroute */
  public async getReroute(req: RerouteRequest): Promise<ApiResponse<RerouteResponse>> {
    const isAhmedabadRoute = req.currentRouteId?.includes('ahmedabad') || req.currentCoords[0] < 80;

    const res = await this.request<RerouteResponse>('/api/routes/reroute', {
      method: 'POST',
      body: JSON.stringify(req),
    });

    if (res.success && res.data) return res;

    const fallbackRoute = isAhmedabadRoute ? AHMEDABAD_KOTA_ROUTE : GUWAHATI_SHILLONG_ROUTE;

    return {
      success: true,
      data: {
        rerouteRecommended: true,
        reason: isAhmedabadRoute
          ? 'Fastest flow via NH-48 / NH-27 Kota corridor'
          : 'Heavy landslide clearing activity on NH-6 sector B',
        currentRoute: fallbackRoute,
        recommendedRoute: {
          ...fallbackRoute,
          id: `${fallbackRoute.id}-reroute`,
          durationMinutes: Math.max(1, fallbackRoute.durationMinutes - 12),
          distanceKm: fallbackRoute.distanceKm,
        },
        metrics: {
          timeSavedMinutes: 12,
          riskReductionPercent: 25,
        },
      },
    };
  }


  /** GET/POST /api/risk/route */
  public async getRouteRisk(routeId = 'route-ghy-shl-nh6'): Promise<ApiResponse<RouteRiskResponse>> {
    const res = await this.request<RouteRiskResponse>(`/api/risk/route?id=${routeId}`);
    if (res.success) return res;

    return {
      success: true,
      data: {
        routeId,
        overallRisk: 'LOW',
        safetyScore: 92,
        riskFactors: [
          {
            factor: 'Ghat Elevation Curves',
            severity: 'LOW',
            description: 'Moderate gradients between Umsning and Umiam Lake',
          },
          {
            factor: 'Weather Advisory',
            severity: 'MEDIUM',
            description: 'Intermittent rainfall and wet road surface',
          },
        ],
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  /** GET /api/accessibility */
  public async getAccessibility(): Promise<ApiResponse<AccessibilityResponse>> {
    const res = await this.request<AccessibilityResponse>('/api/accessibility');
    if (res.success) return res;

    return {
      success: true,
      data: {
        corridors: [
          {
            id: 'corridor-nh6',
            name: 'NH-6 Guwahati–Shillong',
            status: 'OPEN',
            affectedStretch: 'Clear through all checkpoints',
            reportedAt: new Date().toISOString(),
          },
          {
            id: 'corridor-sh1',
            name: 'Old Guwahati Ghat Road',
            status: 'RESTRICTED',
            reason: 'Heavy vehicle restrictions active during peak hours',
            affectedStretch: 'Burnihat boundary',
            reportedAt: new Date().toISOString(),
          },
        ],
      },
    };
  }

  /** GET /api/alerts */
  public async getAlerts(): Promise<ApiResponse<AlertsResponse>> {
    const res = await this.request<AlertsResponse>('/api/alerts');
    if (res.success) return res;

    return {
      success: true,
      data: {
        alerts: [
          {
            id: 'alert-1',
            severity: 'WARNING',
            type: 'ROAD_RESTRICTION',
            title: 'Speed Restriction on Nongpoh Bypass',
            description: 'Road widening work underway. Max speed 40 km/h.',
            location: 'KM 52, NH-6',
            timestamp: new Date().toISOString(),
          },
          {
            id: 'alert-2',
            severity: 'INFO',
            type: 'WEATHER',
            title: 'Ghat Section Fog Alert',
            description: 'Visibility down to 80 meters near Umiam Lake area.',
            location: 'KM 84, NH-6',
            timestamp: new Date().toISOString(),
          },
        ],
      },
    };
  }

  /** GET /api/incidents */
  public async listIncidents(): Promise<ApiResponse<IncidentListResponse>> {
    const res = await this.request<IncidentListResponse>('/api/incidents');
    if (res.success) return res;

    return {
      success: true,
      data: {
        incidents: [
          {
            id: 'inc-01',
            type: 'Fallen Rocks',
            description: 'Minor gravel on shoulder after Nongpoh cutting',
            coordinates: { latitude: 25.9015, longitude: 91.8785 },
            status: 'VERIFIED',
            reportedAt: new Date().toISOString(),
          },
        ],
      },
    };
  }

  /** POST /api/incidents */
  public async createIncident(incident: IncidentReport): Promise<ApiResponse<IncidentReport>> {
    const res = await this.request<IncidentReport>('/api/incidents', {
      method: 'POST',
      body: JSON.stringify(incident),
    });

    if (res.success) return res;

    // Acknowledge locally if offline
    return {
      success: true,
      data: {
        ...incident,
        id: `inc-local-${Date.now()}`,
        status: 'REPORTED',
        reportedAt: new Date().toISOString(),
      },
    };
  }
}

export const apiClient = new ApiClient();
