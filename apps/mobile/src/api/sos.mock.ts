/**
 * ============================================================================
 * LOCAL MOCK SOS ADAPTER (ISOLATED SIMULATION ONLY)
 * ============================================================================
 * 
 * IMPORTANT ARCHITECTURAL NOTICE:
 * There is NO SOS endpoint implemented anywhere in services/api or docs/api-contract.md.
 * 
 * To prevent fabricating non-existent production endpoints while still delivering
 * a fully functional, testable mobile UI, this adapter simulates network latency
 * and responses entirely locally.
 * 
 * Once services/api implements POST /api/sos, this file can be replaced with a
 * real call inside src/api/client.ts.
 */

export interface SosBroadcastPayload {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  driverId: string;
  vehicleRegistration: string;
  corridorName: string;
  emergencyType: 'ACCIDENT' | 'MEDICAL' | 'VEHICLE_BREAKDOWN' | 'ROAD_BLOCK' | 'CRIME_SAFETY';
  additionalNotes?: string;
}

export interface SosBroadcastResult {
  isMockSimulation: true;
  success: boolean;
  sosId: string;
  acknowledgedTimestamp: string;
  dispatchedResponders: string[];
  message: string;
}

/**
 * Simulates broadcasting an emergency SOS payload with a 1200ms network delay.
 */
export async function simulateSosBroadcast(
  payload: SosBroadcastPayload
): Promise<SosBroadcastResult> {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    isMockSimulation: true,
    success: true,
    sosId: `SOS-MOCK-${Math.floor(100000 + Math.random() * 900000)}`,
    acknowledgedTimestamp: new Date().toISOString(),
    dispatchedResponders: [
      'Highway Patrol Unit 4 (Nongpoh Checkpoint)',
      '108 Emergency Ambulance Dispatch (Ribhoi District)',
      'SauraRoute Fleet Incident Command',
    ],
    message: 'Local mock SOS broadcast simulation received. No real emergency services contacted.',
  };
}
