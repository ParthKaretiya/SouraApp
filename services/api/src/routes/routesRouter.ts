import { Router, type Request, type Response } from 'express';
import { routingService } from '../services/routingService.js';
import { routeRegistry, type RouteData, type RerouteResponse } from '../services/routeRegistry.js';

export const routesRouter = Router();

/**
 * Validates coordinate array [longitude, latitude].
 * Checks:
 * - is an array of exactly 2 items
 * - both items are finite numbers
 * - longitude is between -180 and 180
 * - latitude is between -90 and 90
 */
function isValidCoordinate(coord: unknown): coord is [number, number] {
  if (!Array.isArray(coord) || coord.length !== 2) return false;
  const [lng, lat] = coord;
  if (typeof lng !== 'number' || typeof lat !== 'number') return false;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat < -90 || lat > 90) return false;
  return true;
}

/**
 * POST /api/routes/optimize
 * 
 * Computes road-following route geometry and maneuvers between arbitrary
 * origin and destination coordinates via the OSRM routing engine.
 */
routesRouter.post('/optimize', async (req: Request, res: Response): Promise<void> => {
  const { origin, destination } = req.body || {};

  // 1. Validation
  if (!isValidCoordinate(origin) || !isValidCoordinate(destination)) {
    res.status(400).json({
      error: 'INVALID_COORDINATES',
      message: 'Invalid or missing origin/destination. Expected [longitude, latitude] arrays where longitude is between -180 and 180, and latitude is between -90 and 90.',
    });
    return;
  }

  try {
    // 2. Query routing service (OpenStreetMap OSRM protocol)
    const route = await routingService.calculateRoute(origin, destination);

    // 3. Convert to SauraRoute standard RouteData contract
    const originName = `Point (${origin[0].toFixed(4)}, ${origin[1].toFixed(4)})`;
    const destinationName = `Point (${destination[0].toFixed(4)}, ${destination[1].toFixed(4)})`;
    const corridorName = `Road Corridor (${origin[0].toFixed(2)}, ${origin[1].toFixed(2)} → ${destination[0].toFixed(2)}, ${destination[1].toFixed(2)})`;

    const routeData: RouteData = {
      id: `route-${Date.now()}`,
      corridorName,
      origin: {
        name: originName,
        coordinates: origin,
      },
      destination: {
        name: destinationName,
        coordinates: destination,
      },
      distanceKm: route.distanceKm,
      durationMinutes: route.durationMinutes,
      geometry: route.geometry,
      steps: route.steps,
      // Routing-only endpoint: safety, risk, and accessibility analysis are not computed
      // by the OSRM road network engine and are explicitly null to prevent presenting
      // uncalculated data as real safety or accessibility claims.
      safetyScore: null,
      riskLevel: null,
      accessibilityStatus: null,
    };

    // Save in route registry for rerouting lookup
    routeRegistry.saveRoute(routeData);

    res.status(200).json(routeData);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown routing engine error';
    res.status(502).json({
      error: 'ROUTING_SERVICE_ERROR',
      message,
    });
  }
});

/**
 * POST /api/routes/reroute
 * 
 * Computes a new road-following route from the vehicle's current coordinates
 * to the original destination associated with currentRouteId via OSRM.
 */
routesRouter.post('/reroute', async (req: Request, res: Response): Promise<void> => {
  const { currentRouteId, currentCoords } = req.body || {};

  // 1. Validate currentRouteId
  if (!currentRouteId || typeof currentRouteId !== 'string' || currentRouteId.trim() === '') {
    res.status(400).json({
      error: 'INVALID_REQUEST',
      message: 'currentRouteId is required and must be a non-empty string.',
    });
    return;
  }

  // 2. Validate currentCoords
  if (!isValidCoordinate(currentCoords)) {
    res.status(400).json({
      error: 'INVALID_COORDINATES',
      message: 'currentCoords must be an array of exactly [longitude, latitude] numbers where longitude is between -180 and 180, and latitude is between -90 and 90.',
    });
    return;
  }

  // 3. Lookup currentRoute in registry
  const currentRoute = routeRegistry.getRoute(currentRouteId.trim());
  if (!currentRoute) {
    res.status(404).json({
      error: 'ROUTE_NOT_FOUND',
      message: `Route with ID "${currentRouteId}" was not found in the active route registry.`,
    });
    return;
  }

  const destinationCoords = currentRoute.destination.coordinates;

  try {
    // 4. Calculate new route from current vehicle position to existing destination
    const newRoute = await routingService.calculateRoute(currentCoords, destinationCoords);

    // 5. Build recommended RouteData with a new unique route ID
    const recommendedRouteId = `route-${Date.now()}`;
    const recommendedRoute: RouteData = {
      id: recommendedRouteId,
      corridorName: currentRoute.corridorName,
      origin: {
        name: `Current Position (${currentCoords[0].toFixed(4)}, ${currentCoords[1].toFixed(4)})`,
        coordinates: currentCoords,
      },
      destination: currentRoute.destination,
      distanceKm: newRoute.distanceKm,
      durationMinutes: newRoute.durationMinutes,
      geometry: newRoute.geometry,
      steps: newRoute.steps,
      safetyScore: null,
      riskLevel: null,
      accessibilityStatus: null,
    };

    // Save newly calculated route in registry as well
    routeRegistry.saveRoute(recommendedRoute);

    // 6. Formulate RerouteResponse
    const rerouteResponse: RerouteResponse = {
      rerouteRecommended: true,
      reason: 'Route recalculated from current vehicle position',
      currentRoute,
      recommendedRoute,
    };

    res.status(200).json(rerouteResponse);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown routing engine error';
    res.status(502).json({
      error: 'ROUTING_SERVICE_ERROR',
      message,
    });
  }
});
