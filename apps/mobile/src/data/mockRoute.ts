import type { RouteData } from '../types/route';
import ahmedabadKotaData from './ahmedabadKotaRoute.json';
import { GHY_SHL_LOW_COORDS } from './demoScenarioData';

// Static pre-calculated real highway route for Ahmedabad -> Kota (NH-48 & NH-27)
export const AHMEDABAD_KOTA_ROUTE: RouteData = ahmedabadKotaData as unknown as RouteData;

// Static placeholder shaped identically to POST /api/routes/optimize responses
export const GUWAHATI_SHILLONG_ROUTE: RouteData = {
  id: 'route-ghy-shl-nh6',
  corridorName: 'NH-6 Guwahati–Shillong Expressway',
  origin: {
    name: 'Guwahati ISBT',
    coordinates: GHY_SHL_LOW_COORDS[0],
  },
  destination: {
    name: 'Shillong Police Bazar',
    coordinates: GHY_SHL_LOW_COORDS[GHY_SHL_LOW_COORDS.length - 1],
  },
  distanceKm: 98.4,
  durationMinutes: 165,
  geometry: {
    type: 'LineString',
    coordinates: GHY_SHL_LOW_COORDS,
  },

  steps: [
    {
      id: 'step-1',
      instruction: 'Head east on AH1/AH2 towards Khanapara',
      distanceMeters: 450,
      roadName: 'AH1 / GS Road',
      maneuverType: 'straight',
    },
    {
      id: 'step-2',
      instruction: 'At Jorabat junction, keep right onto NH-6 towards Shillong',
      distanceMeters: 12400,
      roadName: 'NH-6 Highway',
      maneuverType: 'keep-right',
    },
    {
      id: 'step-3',
      instruction: 'Continue straight through Nongpoh bypass',
      distanceMeters: 38200,
      roadName: 'NH-6 Nongpoh Bypass',
      maneuverType: 'straight',
    },
    {
      id: 'step-4',
      instruction: 'Prepare for ghat section curves near Umiam Lake',
      distanceMeters: 28500,
      roadName: 'Umiam Scenic Way',
      maneuverType: 'keep-left',
    },
    {
      id: 'step-5',
      instruction: 'Arrive at destination: Shillong Police Bazar',
      distanceMeters: 6200,
      roadName: 'GS Road Shillong',
      maneuverType: 'destination',
    },
  ],
  safetyScore: 92,
  riskLevel: 'LOW',
  accessibilityStatus: 'OPEN',
  hazardAlert: {
    severity: 'WARNING',
    message: 'Advisory: Monsoon fog and wet curves after Nongpoh elevation',
    locationName: 'Nongpoh – Umsning stretch',
  },
};
