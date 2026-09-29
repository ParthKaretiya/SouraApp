import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RouteData } from './route';
import type { RerouteResponse } from '../api/types';

export type RootStackParamList = {
  DriverHome: undefined;
  PlanTrip: undefined;
  Trip: {
    origin?: string;
    destination?: string;
    routeId?: string;
    updatedRoute?: RouteData;
    isNavigating?: boolean;
  } | undefined;
  WhatsAhead: { currentPosition?: [number, number] } | undefined;
  ReportIssue: {
    initialCoords?: {
      latitude: number;
      longitude: number;
    };
  } | undefined;
  Sos: undefined;
  RouteUpdate: {
    reason?: string;
    recommendedEta?: string;
    rerouteData?: RerouteResponse;
  } | undefined;
};

export type DriverHomeScreenProps = NativeStackScreenProps<RootStackParamList, 'DriverHome'>;
export type PlanTripScreenProps = NativeStackScreenProps<RootStackParamList, 'PlanTrip'>;
export type TripScreenProps = NativeStackScreenProps<RootStackParamList, 'Trip'>;
export type WhatsAheadScreenProps = NativeStackScreenProps<RootStackParamList, 'WhatsAhead'>;
export type ReportIssueScreenProps = NativeStackScreenProps<RootStackParamList, 'ReportIssue'>;
export type SosScreenProps = NativeStackScreenProps<RootStackParamList, 'Sos'>;
export type RouteUpdateScreenProps = NativeStackScreenProps<RootStackParamList, 'RouteUpdate'>;
