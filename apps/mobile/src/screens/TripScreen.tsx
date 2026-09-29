import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, radius, layout, shadows } from '../theme';
import { DriverHeader } from '../components/DriverHeader';
import { DriverEtaBar } from '../components/DriverEtaBar';
import { DriverManeuverCard } from '../components/DriverManeuverCard';
import { DriverSafetyBanner } from '../components/DriverSafetyBanner';
import { DriverBottomNav } from '../components/DriverBottomNav';
import { DriverMapView, DriverMapViewRef } from '../components/map/DriverMapView';
import { useDemo } from '../context/DemoContext';
import type { TripScreenProps } from '../types/navigation';

export const TripScreen: React.FC<TripScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<DriverMapViewRef>(null);

  const {
    activeRoute,
    selectedRouteIndex,
    selectRoute,
    isSimulating,
    simulationIndex,
    simulatedCoords,
    simulatedHeading,
    remainingDistanceKm,
    remainingDurationMin,
    currentManeuver,
    toggleSimulateDrive,
    activeCorridorStatus,
    activeRiskLevel,
    showCriticalAlert,
    activeCriticalAlert,
    hasRerouted,
    triggerDemoAlert,
    acceptReroute,
    keepCurrentRoute,
    resetDemo,
  } = useDemo();

  const [showExitModal, setShowExitModal] = useState(false);

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const handleExitNav = () => {
    setShowExitModal(false);
    navigation.navigate('DriverHome');
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <DriverHeader
        title={activeRoute.corridorName}
        subtitle={`${activeRoute.origin.name} → ${activeRoute.destination.name}`}
        statusText={
          hasRerouted
            ? 'DETOUR ACTIVE'
            : activeCorridorStatus === 'CLOSED'
            ? 'ROAD CLOSED'
            : isSimulating
            ? 'SIMULATION RUNNING'
            : 'NAVIGATION READY'
        }
        statusType={
          hasRerouted
            ? 'warning'
            : activeCorridorStatus === 'CLOSED'
            ? 'danger'
            : 'success'
        }
        showBack={true}
        onBackPress={() => setShowExitModal(true)}
        onSosPress={() => navigation.navigate('Sos')}
      />

      {/* MAP CONTAINER (HERO VISUAL) */}
      <View style={styles.mapContainer}>
        <DriverMapView
          ref={mapRef}
          routeData={activeRoute}
          liveLocation={{
            latitude: simulatedCoords[1],
            longitude: simulatedCoords[0],
            heading: simulatedHeading,
          }}
          simulatedPos={{
            longitude: simulatedCoords[0],
            latitude: simulatedCoords[1],
            heading: simulatedHeading,
            stepIndex: simulationIndex,
          }}
          isSimulating={isSimulating}
          isFollowingDriver={true}
        />

        {/* FLOATING TOP CHROME: MANEUVER CARD & NOTICES */}
        <View style={styles.floatingTopContainer} pointerEvents="box-none">
          {hasRerouted && (
            <View style={styles.rerouteSuccessBanner}>
              <Text style={styles.rerouteSuccessText}>
                ✓ Hazard Bypassed • New Safe Corridor Active
              </Text>
            </View>
          )}

          <DriverManeuverCard step={currentManeuver} />

          {activeRoute.hazardAlert && !hasRerouted && (
            <DriverSafetyBanner
              severity={activeRoute.hazardAlert.severity}
              message={activeRoute.hazardAlert.message}
              locationName={activeRoute.hazardAlert.locationName}
              onPressDetails={() => navigation.navigate('WhatsAhead')}
            />
          )}
        </View>

        {/* FLOATING ROUTE RISK SELECTOR (LOW, MEDIUM, HIGH) */}
        <View style={styles.floatingRiskBar} pointerEvents="box-none">
          <TouchableOpacity
            style={[
              styles.riskSwitchPill,
              selectedRouteIndex === 0 && styles.riskPillLowActive,
            ]}
            onPress={() => selectRoute(0)}
            activeOpacity={0.8}
          >
            <Text style={styles.riskSwitchDot}>🟢</Text>
            <Text
              style={[
                styles.riskSwitchText,
                selectedRouteIndex === 0 && styles.riskTextActive,
              ]}
            >
              Low Risk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.riskSwitchPill,
              selectedRouteIndex === 1 && styles.riskPillMedActive,
            ]}
            onPress={() => selectRoute(1)}
            activeOpacity={0.8}
          >
            <Text style={styles.riskSwitchDot}>🟡</Text>
            <Text
              style={[
                styles.riskSwitchText,
                selectedRouteIndex === 1 && styles.riskTextActive,
              ]}
            >
              Medium Risk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.riskSwitchPill,
              selectedRouteIndex === 2 && styles.riskPillHighActive,
            ]}
            onPress={() => selectRoute(2)}
            activeOpacity={0.8}
          >
            <Text style={styles.riskSwitchDot}>🔴</Text>
            <Text
              style={[
                styles.riskSwitchText,
                selectedRouteIndex === 2 && styles.riskTextActive,
              ]}
            >
              High Risk
            </Text>
          </TouchableOpacity>
        </View>

        {/* FLOATING DEMO CONTROLS BAR (REQUIREMENTS 10, 13, 19) */}
        <View style={styles.demoControlsBar}>

          <TouchableOpacity
            style={[styles.demoBtn, isSimulating && styles.demoBtnSimulating]}
            onPress={toggleSimulateDrive}
            activeOpacity={0.8}
          >
            <Text style={styles.demoBtnText}>
              {isSimulating ? '⏸ Pause' : '▶ Simulate Drive'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoAlertBtn}
            onPress={triggerDemoAlert}
            activeOpacity={0.8}
          >
            <Text style={styles.demoAlertBtnText}>⚡ Trigger Demo Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoAheadBtn}
            onPress={() => navigation.navigate('WhatsAhead')}
            activeOpacity={0.8}
          >
            <Text style={styles.demoAheadBtnText}>⚠ Ahead</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoResetBtn}
            onPress={resetDemo}
            activeOpacity={0.8}
          >
            <Text style={styles.demoResetBtnText}>↻ Reset</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM ETA BAR WITH CORRIDOR STATUS & RISK STRIP (MOMENT 2) */}
      <DriverEtaBar
        remainingTime={formatDuration(remainingDurationMin)}
        remainingDistance={`${remainingDistanceKm} km`}
        destinationName={activeRoute.destination.name}
        progressPercent={Math.min(
          100,
          Math.max(
            5,
            Math.round(
              (simulationIndex / Math.max(1, activeRoute.geometry.coordinates.length - 1)) * 100
            )
          )
        )}
        corridorStatus={activeCorridorStatus}
        riskLevel={activeRiskLevel}
      />

      {/* BOTTOM NAVIGATION BAR */}
      <DriverBottomNav
        activeTab="trip"
        onNavigate={(tab) => {
          if (tab === 'home') navigation.navigate('DriverHome');
          if (tab === 'ahead') navigation.navigate('WhatsAhead');
          if (tab === 'report') navigation.navigate('ReportIssue');
          if (tab === 'sos') navigation.navigate('Sos');
        }}
      />

      {/* MOMENT 4: PROMINENT CRITICAL ALERT MODAL (REQUIREMENTS 14 & 15) */}
      <Modal
        visible={showCriticalAlert}
        transparent={true}
        animationType="fade"
        onRequestClose={keepCurrentRoute}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.criticalCard}>
            {/* CRITICAL ALERT HEADER */}
            <View style={styles.criticalHeader}>
              <View style={styles.criticalIconCircle}>
                <Text style={styles.criticalIconGlyph}>🚨</Text>
              </View>
              <View style={styles.criticalHeaderTitles}>
                <Text style={styles.criticalBadgeText}>CRITICAL HAZARD DETECTED</Text>
                <Text style={styles.criticalTitle}>
                  {activeCriticalAlert?.title || 'Fresh Landslide Reported'}
                </Text>
              </View>
            </View>

            {/* LOCATION & CLOSURE BANNER */}
            <View style={styles.closureBanner}>
              <Text style={styles.closureBannerText}>
                ⛔ ROAD CLOSED: BOTH DIRECTIONS
              </Text>
              <Text style={styles.closureLocationText}>
                Location: {activeCriticalAlert?.locationName || 'Sonapur Cliff (Km 68.4)'}
              </Text>
            </View>

            <Text style={styles.criticalDescription}>
              {activeCriticalAlert?.description ||
                'Major mudflow and debris across both highway lanes. Transport halted by disaster authority.'}
            </Text>

            {/* DETOUR ANALYSIS CARD */}
            <View style={styles.detourProposalCard}>
              <View style={styles.detourHeader}>
                <Text style={styles.detourReadyTag}>✓ SAFE DETOUR AVAILABLE</Text>
                <Text style={styles.detourStatusPill}>ROAD OPEN</Text>
              </View>
              <Text style={styles.detourName}>West Umsning Valley Bypass</Text>
              <View style={styles.detourMetricsRow}>
                <Text style={styles.detourMetricText}>+9.8 km detour</Text>
                <Text style={styles.detourDot}>•</Text>
                <Text style={styles.detourMetricText}>+20 min travel time</Text>
                <Text style={styles.detourDot}>•</Text>
                <Text style={styles.detourMetricGreen}>70% Lower Risk</Text>
              </View>
            </View>

            {/* ACTION BUTTONS (ACCEPT VS KEEP) */}
            <View style={styles.criticalBtnRow}>
              <TouchableOpacity
                style={styles.keepRouteBtn}
                onPress={keepCurrentRoute}
                activeOpacity={0.8}
              >
                <Text style={styles.keepRouteBtnText}>Keep Current</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.acceptRouteBtn}
                onPress={acceptReroute}
                activeOpacity={0.85}
              >
                <Text style={styles.acceptRouteBtnText}>Accept New Route →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* EXIT CONFIRMATION MODAL */}
      <Modal visible={showExitModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.exitModalCard}>
            <Text style={styles.exitTitle}>Exit Navigation?</Text>
            <Text style={styles.exitSubtitle}>
              Return to the driver home dashboard.
            </Text>
            <View style={styles.exitBtnRow}>
              <TouchableOpacity
                style={styles.cancelExitBtn}
                onPress={() => setShowExitModal(false)}
              >
                <Text style={styles.cancelExitBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmExitBtn}
                onPress={handleExitNav}
              >
                <Text style={styles.confirmExitBtnText}>Exit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  floatingTopContainer: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.md,
    right: spacing.md,
    zIndex: 30,
    gap: spacing.xs,
  },
  rerouteSuccessBanner: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    ...shadows.card,
  },
  rerouteSuccessText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  floatingRiskBar: {
    position: 'absolute',
    bottom: 64,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 40,
  },
  riskSwitchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: '#334155',
    ...shadows.card,
  },
  riskPillLowActive: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  riskPillMedActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#78350F',
  },
  riskPillHighActive: {
    borderColor: '#EF4444',
    backgroundColor: '#7F1D1D',
  },
  riskSwitchDot: {
    fontSize: 10,
    marginRight: 5,
  },
  riskSwitchText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  riskTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  demoControlsBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 40,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    padding: 8,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },

  demoBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  demoBtnSimulating: {
    backgroundColor: '#F59E0B',
  },
  demoBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  demoAlertBtn: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  demoAlertBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  demoAheadBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  demoAheadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  demoResetBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#475569',
  },
  demoResetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  criticalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 420,
    borderWidth: 2,
    borderColor: colors.danger,
    ...shadows.modal,
  },
  criticalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  criticalIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  criticalIconGlyph: {
    fontSize: 22,
  },
  criticalHeaderTitles: {
    flex: 1,
  },
  criticalBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  criticalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 2,
  },
  closureBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 10,
  },
  closureBannerText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#991B1B',
  },
  closureLocationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F1D1D',
    marginTop: 2,
  },
  criticalDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  detourProposalCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  detourHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detourReadyTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  detourStatusPill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  detourName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detourMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  detourMetricText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  detourDot: {
    fontSize: 10,
    color: colors.textMuted,
    marginHorizontal: 6,
  },
  detourMetricGreen: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  criticalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keepRouteBtn: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  keepRouteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  acceptRouteBtn: {
    flex: 1.5,
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadows.subtle,
  },
  acceptRouteBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  exitModalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: '85%',
    maxWidth: 340,
    alignItems: 'center',
    ...shadows.modal,
  },
  exitTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  exitSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  exitBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelExitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  cancelExitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  confirmExitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  confirmExitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
