import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, layout, shadows } from '../theme';
import { DriverHeader } from '../components/DriverHeader';
import { DriverBottomNav } from '../components/DriverBottomNav';
import { useDemo } from '../context/DemoContext';
import type { SosScreenProps } from '../types/navigation';

export const SosScreen: React.FC<SosScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { simulatedCoords, selectedCorridor, sosState, confirmSos, resetSos } = useDemo();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEmergencyType, setSelectedEmergencyType] = useState<string>('VEHICLE CRASH / LANDSLIDE');

  const emergencyCategories = [
    { id: 'ACCIDENT', label: 'Vehicle Crash', icon: '💥' },
    { id: 'LANDSLIDE', label: 'Trapped in Landslide', icon: '⛰️' },
    { id: 'MEDICAL', label: 'Medical Emergency', icon: '🏥' },
    { id: 'BREAKDOWN', label: 'Mechanical Failure', icon: '🔧' },
  ];

  const handleOpenConfirm = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmEmergency = () => {
    setShowConfirmModal(false);
    confirmSos();
  };

  return (
    <View style={styles.container}>
      <DriverHeader
        title={t('emergencySos', 'Emergency SOS')}
        subtitle={selectedCorridor.corridorName}
        statusText={sosState.isConfirmed ? 'SOS DISPATCHED' : 'EMERGENCY STANDBY'}
        statusType={sosState.isConfirmed ? 'danger' : 'warning'}
        showBack={true}
        showSos={false}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sosState.isConfirmed && sosState.receipt ? (
          /* CONFIRMED DISPATCH COCKPIT (REQUIREMENT 18) */
          <View style={styles.dispatchedCard}>
            <View style={styles.simulatedWatermark}>
              <Text style={styles.simulatedWatermarkText}>SIMULATED • DEMO MODE</Text>
            </View>

            <View style={styles.dispatchedIconCircle}>
              <Text style={styles.dispatchedIcon}>🚨</Text>
            </View>

            <Text style={styles.dispatchedTitle}>SOS DISPATCHED</Text>
            <Text style={styles.dispatchedSubtitle}>
              Emergency response units have been alerted with your telemetry and GPS coordinates. Response initiated.
            </Text>

            {/* RECEIPT SUMMARY */}
            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>SOS DISPATCH ID:</Text>
                <Text style={styles.receiptVal}>{sosState.receipt.sosId}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>TIME TRANSMITTED:</Text>
                <Text style={styles.receiptVal}>{sosState.receipt.timestamp}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>GPS TELEMETRY:</Text>
                <Text style={styles.receiptVal}>{sosState.receipt.coordinates}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>CORRIDOR:</Text>
                <Text style={styles.receiptVal}>{selectedCorridor.corridorName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>STATUS:</Text>
                <Text style={styles.dispatchStatusPill}>RESPONSE INITIATED</Text>
              </View>
            </View>

            {/* ASSIGNED RESPONDERS (REQUIREMENT 18) */}
            <Text style={styles.respondersHeader}>DISPATCHED EMERGENCY UNITS:</Text>
            <View style={styles.respondersList}>
              {sosState.receipt.responders.map((resp, rIdx) => (
                <View key={rIdx} style={styles.responderRow}>
                  <View style={styles.responderDot} />
                  <View style={styles.responderTextCol}>
                    <Text style={styles.responderUnitName}>{resp.unit}</Text>
                    <Text style={styles.responderStatusText}>{resp.status}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* ACTIONS */}
            <TouchableOpacity
              style={styles.returnNavBtn}
              onPress={() => navigation.navigate('Trip')}
              activeOpacity={0.85}
            >
              <Text style={styles.returnNavBtnText}>Return to Live Navigation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.standDownBtn}
              onPress={resetSos}
              activeOpacity={0.7}
            >
              <Text style={styles.standDownBtnText}>Stand Down / Reset SOS</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* STEP 1: INITIAL SOS TRIGGER SCREEN */
          <View>
            {/* DEMO NOTICE */}
            <View style={styles.demoNoticeBanner}>
              <Text style={styles.demoNoticeText}>
                DEMO MODE: Simulated emergency distress beacon. No real 112/police dispatch calls are made.
              </Text>
            </View>

            {/* GPS LOCATION STAMP */}
            <View style={styles.gpsStampCard}>
              <View style={styles.gpsDot} />
              <View style={styles.gpsTextCol}>
                <Text style={styles.gpsStampLabel}>CURRENT VEHICLE GPS ANCHOR</Text>
                <Text style={styles.gpsStampVal}>
                  {simulatedCoords[1].toFixed(4)}° N, {simulatedCoords[0].toFixed(4)}° E
                </Text>
                <Text style={styles.gpsCorridorText}>{selectedCorridor.corridorName}</Text>
              </View>
            </View>

            {/* EMERGENCY CATEGORY SELECTOR */}
            <Text style={styles.sectionTitle}>SELECT NATURE OF DISTRESS:</Text>
            <View style={styles.categoryGrid}>
              {emergencyCategories.map((cat) => {
                const isSelected = selectedEmergencyType === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      isSelected && styles.categoryCardSelected,
                    ]}
                    onPress={() => setSelectedEmergencyType(cat.label)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryIcon}>{cat.icon}</Text>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* BIG RED PANIC BUTTON (STEP 1) */}
            <View style={styles.panicContainer}>
              <TouchableOpacity
                style={styles.panicButton}
                onPress={handleOpenConfirm}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Trigger SOS Emergency"
              >
                <Text style={styles.panicIcon}>🚨</Text>
                <Text style={styles.panicButtonText}>TRANSMIT SOS</Text>
                <Text style={styles.panicSubtext}>Tap to initiate confirmation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* STEP 2: CONFIRMATION MODAL (REQUIREMENT 18) */}
      <Modal visible={showConfirmModal} transparent={true} animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWrap}>
              <Text style={styles.confirmIcon}>🚨</Text>
            </View>

            <Text style={styles.confirmTitle}>Confirm Emergency?</Text>
            <Text style={styles.confirmSubtitle}>
              Emergency services will be notified with your vehicle GPS coordinates at{' '}
              <Text style={styles.boldCoords}>
                {simulatedCoords[1].toFixed(4)}° N, {simulatedCoords[0].toFixed(4)}° E
              </Text>.
            </Text>

            <View style={styles.confirmBtnRow}>
              <TouchableOpacity
                style={styles.cancelConfirmBtn}
                onPress={() => setShowConfirmModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelConfirmBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmSosBtn}
                onPress={handleConfirmEmergency}
                activeOpacity={0.85}
              >
                <Text style={styles.confirmSosBtnText}>Confirm Emergency</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* BOTTOM NAVIGATION */}
      <DriverBottomNav
        activeTab="sos"
        onNavigate={(tab) => {
          if (tab === 'home') navigation.navigate('DriverHome');
          if (tab === 'trip') navigation.navigate('Trip');
          if (tab === 'ahead') navigation.navigate('WhatsAhead');
          if (tab === 'report') navigation.navigate('ReportIssue');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 90,
  },
  demoNoticeBanner: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: spacing.md,
  },
  demoNoticeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    textAlign: 'center',
  },
  gpsStampCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  gpsDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.danger,
    marginRight: 10,
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsStampLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  gpsStampVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  gpsCorridorText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
  },
  categoryCardSelected: {
    borderColor: colors.danger,
    backgroundColor: '#FFF5F5',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  panicContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  panicButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 8,
    borderColor: '#FECACA',
    ...shadows.modal,
  },
  panicIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  panicButtonText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  panicSubtext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FEE2E2',
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger,
    ...shadows.modal,
  },
  confirmIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmIcon: {
    fontSize: 28,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  boldCoords: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  confirmBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
  },
  cancelConfirmBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  confirmSosBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  confirmSosBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dispatchedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.danger,
    position: 'relative',
    ...shadows.card,
  },
  simulatedWatermark: {
    position: 'absolute',
    top: 10,
    right: 12,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  simulatedWatermarkText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
  },
  dispatchedIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  dispatchedIcon: {
    fontSize: 30,
  },
  dispatchedTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.danger,
    letterSpacing: 0.5,
  },
  dispatchedSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginVertical: 6,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: 12,
    gap: 8,
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  dispatchStatusPill: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  respondersHeader: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
    marginBottom: 8,
  },
  respondersList: {
    width: '100%',
    gap: 8,
    marginBottom: spacing.lg,
  },
  responderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 10,
  },
  responderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.functionalGreen,
    marginRight: 10,
  },
  responderTextCol: {
    flex: 1,
  },
  responderUnitName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  responderStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.functionalGreen,
    marginTop: 1,
  },
  returnNavBtn: {
    width: '100%',
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: 10,
    ...shadows.subtle,
  },
  returnNavBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  standDownBtn: {
    paddingVertical: 8,
  },
  standDownBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
