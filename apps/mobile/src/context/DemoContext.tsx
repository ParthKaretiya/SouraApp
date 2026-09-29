import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';

import {
  DEMO_CORRIDORS,
  getDemoCorridor,
  evaluateCandidateRoutes,
  getDemoSosReceipt,
  type Corridor,
  type EvaluatedRouteOption,
  type Hazard,
  type Incident,
  type SOSResponse,
  type RouteMetrics,
} from '../data/demoScenarioData';
import type { RouteData, RouteManeuverStep } from '../types/route';

export interface DemoContextType {
  // Corridors
  corridors: Corridor[];
  selectedCorridorId: string;
  selectedCorridor: Corridor;
  setCorridor: (id: string) => void;

  // Evaluated Routes & 1.35x Constraints (Moment 1)
  evaluatedRoutes: EvaluatedRouteOption[];
  selectedRouteIndex: number;
  selectRoute: (index: number) => void;
  fastestDistance: number;
  fastestTime: number;
  maxDistance135: number;
  maxTime135: number;

  // Active Route & Driving Navigation (Moment 2)
  activeRoute: RouteData;
  isDriving: boolean;
  startDriving: () => void;
  stopDriving: () => void;

  // Simulation Controls (Moment 2)
  isSimulating: boolean;
  simulationIndex: number;
  simulatedCoords: [number, number]; // [lng, lat]
  simulatedHeading: number;
  remainingDistanceKm: number;
  remainingDurationMin: number;
  currentManeuver: RouteManeuverStep;
  toggleSimulateDrive: () => void;
  stepSimulation: () => void;

  // Corridor Status & Risk
  activeCorridorStatus: 'OPEN' | 'RESTRICTED' | 'CLOSED';
  activeRiskScore: number;
  activeRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';

  // What's Ahead Hazards (Moment 3)
  hazards: Hazard[];

  // Critical Alert & Dynamic Rerouting (Moment 4)
  showCriticalAlert: boolean;
  activeCriticalAlert: Corridor['dynamicRerouteScenario']['criticalAlert'] | null;
  hasRerouted: boolean;
  closedRoads: string[];
  triggerDemoAlert: () => void;
  acceptReroute: () => void;
  keepCurrentRoute: () => void;
  dismissCriticalAlert: () => void;

  // Report Issue (Moment 5)
  submittedReports: Incident[];
  submitIncident: (
    type: Incident['type'],
    description?: string,
    overrideCoords?: { latitude: number; longitude: number }
  ) => Incident;

  // Emergency SOS (Moment 5)
  sosState: {
    isConfirmed: boolean;
    receipt: SOSResponse | null;
  };
  confirmSos: () => SOSResponse;
  resetSos: () => void;

  // Reset Everything (Requirement 19)
  resetDemo: () => void;
}

const DemoContext = createContext<DemoContextType | null>(null);

export const DemoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Corridor State
  const [selectedCorridorId, setSelectedCorridorId] = useState<string>('guwahati-shillong');
  const selectedCorridor = useMemo(() => getDemoCorridor(selectedCorridorId), [selectedCorridorId]);

  // 2. Evaluated Candidate Routes & 1.35x Constraints (Moment 1)
  const routeEvaluation = useMemo(() => {
    return evaluateCandidateRoutes(selectedCorridor.candidateRoutes);
  }, [selectedCorridor]);

  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);

  // Synchronize recommended route index when corridor changes
  useEffect(() => {
    setSelectedRouteIndex(routeEvaluation.recommendedIndex);
  }, [routeEvaluation.recommendedIndex, selectedCorridorId]);

  // 3. Active Route (Defaults to chosen candidate, or bypass route when rerouted)
  const [customActiveRoute, setCustomActiveRoute] = useState<RouteData | null>(null);

  const activeRoute = useMemo<RouteData>(() => {
    if (customActiveRoute) return customActiveRoute;
    const selected = routeEvaluation.evaluatedRoutes[selectedRouteIndex];
    return selected ? selected.routeData : selectedCorridor.candidateRoutes[0].routeData;
  }, [customActiveRoute, routeEvaluation.evaluatedRoutes, selectedRouteIndex, selectedCorridor]);

  // 4. Navigation & Driving State
  const [isDriving, setIsDriving] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationIndex, setSimulationIndex] = useState<number>(0);

  // 5. Critical Alert & Rerouting State (Moment 4)
  const [showCriticalAlert, setShowCriticalAlert] = useState<boolean>(false);
  const [activeCriticalAlert, setActiveCriticalAlert] = useState<
    Corridor['dynamicRerouteScenario']['criticalAlert'] | null
  >(null);
  const [hasRerouted, setHasRerouted] = useState<boolean>(false);
  const [closedRoads, setClosedRoads] = useState<string[]>([]);

  // 6. Crowdsourced Reports & SOS State (Moment 5)
  const [submittedReports, setSubmittedReports] = useState<Incident[]>([]);
  const [sosState, setSosState] = useState<{
    isConfirmed: boolean;
    receipt: SOSResponse | null;
  }>({
    isConfirmed: false,
    receipt: null,
  });

  // Calculate simulated vehicle coordinates along active route geometry
  const coordinates = activeRoute.geometry.coordinates;
  const totalWaypoints = coordinates.length;

  const simulatedCoords = useMemo<[number, number]>(() => {
    if (totalWaypoints === 0) return [91.7362, 26.1445];
    const safeIdx = Math.min(simulationIndex, totalWaypoints - 1);
    return coordinates[safeIdx];
  }, [coordinates, simulationIndex, totalWaypoints]);

  // Calculate simulated heading
  const simulatedHeading = useMemo<number>(() => {
    if (totalWaypoints < 2) return 0;
    const currentIdx = Math.min(simulationIndex, totalWaypoints - 1);
    const nextIdx = Math.min(simulationIndex + 1, totalWaypoints - 1);
    if (currentIdx === nextIdx) return 0;
    const p1 = coordinates[currentIdx];
    const p2 = coordinates[nextIdx];
    const dLng = p2[0] - p1[0];
    const dLat = p2[1] - p1[1];
    const angleRad = Math.atan2(dLng, dLat);
    let deg = (angleRad * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }, [coordinates, simulationIndex, totalWaypoints]);

  // Calculate remaining distance and duration based on progress
  const progressRatio = totalWaypoints > 1 ? simulationIndex / (totalWaypoints - 1) : 0;
  const remainingDistanceKm = Number((activeRoute.distanceKm * Math.max(0.05, 1 - progressRatio)).toFixed(1));
  const remainingDurationMin = Math.max(2, Math.round(activeRoute.durationMinutes * (1 - progressRatio)));

  // Calculate active maneuver step
  const currentManeuver = useMemo<RouteManeuverStep>(() => {
    if (!activeRoute.steps || activeRoute.steps.length === 0) {
      return {
        id: 'step-def',
        instruction: 'Proceed along route corridor',
        distanceMeters: Math.round(remainingDistanceKm * 1000),
        roadName: activeRoute.corridorName,
        maneuverType: 'straight',
      };
    }
    const stepIdx = Math.min(
      Math.floor(progressRatio * activeRoute.steps.length),
      activeRoute.steps.length - 1
    );
    return activeRoute.steps[stepIdx];
  }, [activeRoute.steps, activeRoute.corridorName, progressRatio, remainingDistanceKm]);

  // Derived Corridor Status & Risk
  const activeCorridorStatus = useMemo<'OPEN' | 'RESTRICTED' | 'CLOSED'>(() => {
    if (hasRerouted) return 'OPEN';
    if (closedRoads.length > 0) return 'CLOSED';
    return activeRoute.accessibilityStatus || 'OPEN';
  }, [hasRerouted, closedRoads, activeRoute.accessibilityStatus]);

  const activeRiskScore = activeRoute.safetyScore || 85;
  const activeRiskLevel = activeRoute.riskLevel || 'LOW';

  // Programmatically sorted hazards by distance ahead (Requirement 11)
  const hazards = useMemo<Hazard[]>(() => {
    return [...selectedCorridor.whatsAheadHazards].sort((a, b) => a.distanceAheadKm - b.distanceAheadKm);
  }, [selectedCorridor.whatsAheadHazards]);

  // Simulation timer
  const simTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stepSimulation = useCallback(() => {
    setSimulationIndex((prev) => {
      if (prev >= totalWaypoints - 1) {
        return 0; // loop back for repeatable recording
      }
      return prev + 1;
    });
  }, [totalWaypoints]);

  useEffect(() => {
    if (isSimulating) {
      simTimerRef.current = setInterval(() => {
        stepSimulation();
      }, 1500); // 1.5s per waypoint
    } else {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    }
    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
      }
    };
  }, [isSimulating, stepSimulation]);

  // Actions
  const setCorridor = useCallback((id: string) => {
    setSelectedCorridorId(id);
    setCustomActiveRoute(null);
    setHasRerouted(false);
    setShowCriticalAlert(false);
    setActiveCriticalAlert(null);
    setClosedRoads([]);
    setSimulationIndex(0);
    setIsSimulating(false);
  }, []);

  const selectRoute = useCallback((index: number) => {
    setSelectedRouteIndex(index);
    setCustomActiveRoute(null);
    setSimulationIndex(0);
  }, []);

  const startDriving = useCallback(() => {
    setIsDriving(true);
  }, []);

  const stopDriving = useCallback(() => {
    setIsDriving(false);
    setIsSimulating(false);
  }, []);

  const toggleSimulateDrive = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const triggerDemoAlert = useCallback(() => {
    setActiveCriticalAlert(selectedCorridor.dynamicRerouteScenario.criticalAlert);
    setShowCriticalAlert(true);
  }, [selectedCorridor]);

  const acceptReroute = useCallback(() => {
    const detourRoute = selectedCorridor.dynamicRerouteScenario.rerouteData.recommendedRoute;
    if (detourRoute) {
      setClosedRoads((prev) => [...prev, selectedCorridor.corridorName]);
      setCustomActiveRoute(detourRoute);
      setHasRerouted(true);
      setShowCriticalAlert(false);
      setActiveCriticalAlert(null);
      setSimulationIndex(0); // reset vehicle to start of detour
    }
  }, [selectedCorridor]);

  const keepCurrentRoute = useCallback(() => {
    setShowCriticalAlert(false);
  }, []);

  const dismissCriticalAlert = useCallback(() => {
    setShowCriticalAlert(false);
  }, []);

  const submitIncident = useCallback(
    (
      type: Incident['type'],
      description?: string,
      overrideCoords?: { latitude: number; longitude: number }
    ): Incident => {
      const coords = overrideCoords || {
        latitude: simulatedCoords[1],
        longitude: simulatedCoords[0],
      };

      const newIncident: Incident = {
        id: `INC-DEMO-${100 + submittedReports.length}`,
        type,
        description:
          description ||
          `${type} reported by commercial transport driver near simulated coordinates.`,
        coordinates: coords,
        reportedAt: 'Just now',
        status: 'VERIFIED',
        isSimulated: true,
      };

      setSubmittedReports((prev) => [newIncident, ...prev]);
      return newIncident;
    },
    [simulatedCoords, submittedReports.length]
  );

  const confirmSos = useCallback((): SOSResponse => {
    const receipt = getDemoSosReceipt({
      latitude: simulatedCoords[1],
      longitude: simulatedCoords[0],
    });
    setSosState({
      isConfirmed: true,
      receipt,
    });
    return receipt;
  }, [simulatedCoords]);

  const resetSos = useCallback(() => {
    setSosState({
      isConfirmed: false,
      receipt: null,
    });
  }, []);

  // Complete Reset Demo (Requirement 19)
  const resetDemo = useCallback(() => {
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    setSelectedCorridorId('guwahati-shillong');
    setSelectedRouteIndex(0);
    setCustomActiveRoute(null);
    setIsDriving(false);
    setIsSimulating(false);
    setSimulationIndex(0);
    setShowCriticalAlert(false);
    setActiveCriticalAlert(null);
    setHasRerouted(false);
    setClosedRoads([]);
    setSubmittedReports([]);
    setSosState({
      isConfirmed: false,
      receipt: null,
    });
  }, []);

  const value: DemoContextType = {
    corridors: DEMO_CORRIDORS,
    selectedCorridorId,
    selectedCorridor,
    setCorridor,

    evaluatedRoutes: routeEvaluation.evaluatedRoutes,
    selectedRouteIndex,
    selectRoute,
    fastestDistance: routeEvaluation.fastestDistance,
    fastestTime: routeEvaluation.fastestTime,
    maxDistance135: routeEvaluation.maxDistance135,
    maxTime135: routeEvaluation.maxTime135,

    activeRoute,
    isDriving,
    startDriving,
    stopDriving,

    isSimulating,
    simulationIndex,
    simulatedCoords,
    simulatedHeading,
    remainingDistanceKm,
    remainingDurationMin,
    currentManeuver,
    toggleSimulateDrive,
    stepSimulation,

    activeCorridorStatus,
    activeRiskScore,
    activeRiskLevel,

    hazards,

    showCriticalAlert,
    activeCriticalAlert,
    hasRerouted,
    closedRoads,
    triggerDemoAlert,
    acceptReroute,
    keepCurrentRoute,
    dismissCriticalAlert,

    submittedReports,
    submitIncident,

    sosState,
    confirmSos,
    resetSos,

    resetDemo,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
};

export const useDemo = (): DemoContextType => {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
};
