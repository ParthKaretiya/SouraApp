import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing, radius, layout, shadows } from '../theme';
import { useDemo } from '../context/DemoContext';
import type { EvaluatedRouteOption } from '../data/demoScenarioData';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';

type PlanTripScreenProps = NativeStackScreenProps<RootStackParamList, 'PlanTrip'>;

export const PlanTripScreen: React.FC<PlanTripScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const {
    corridors,
    selectedCorridorId,
    selectedCorridor,
    setCorridor,
    evaluatedRoutes,
    selectedRouteIndex,
    selectRoute,
    fastestDistance,
    fastestTime,
    maxDistance135,
    maxTime135,
    startDriving,
    activeRoute,
  } = useDemo();

  const handleStartDriving = () => {
    startDriving();
    navigation.navigate('Trip', {
      updatedRoute: activeRoute,
      isNavigating: true,
    });
  };

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const selectedCandidate = evaluatedRoutes[selectedRouteIndex] || evaluatedRoutes[0];

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>{t('planTripTitle', 'Plan your trip')}</Text>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>DEMO DATA</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>
            {t('compareRoutes', 'Compare 3 options within 1.35× detour constraint')}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CORRIDOR SWITCHER TABS (REQUIREMENT 2) */}
        <View style={styles.corridorSection}>
          <Text style={styles.sectionLabel}>CHOOSE CORRIDOR:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.corridorPillsRow}
          >
            {corridors.map((c) => {
              const isSelected = c.id === selectedCorridorId;
              const icon =
                c.id.includes('guwahati') ? '🏔️' : c.id.includes('dimapur') ? '🌲' : '🛣️';
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.corridorPill, isSelected && styles.corridorPillActive]}
                  onPress={() => setCorridor(c.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.corridorPillIcon}>{icon}</Text>
                  <Text
                    style={[
                      styles.corridorPillText,
                      isSelected && styles.corridorPillTextActive,
                    ]}
                  >
                    {c.corridorName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ORIGIN & DESTINATION CARD */}
        <View style={styles.routePointsCard}>
          <View style={styles.pointRow}>
            <View style={styles.originIndicatorDot} />
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointLabel}>ORIGIN</Text>
              <Text style={styles.pointName}>{selectedCorridor.origin.name}</Text>
              <Text style={styles.pointSubtitle}>{selectedCorridor.origin.subtitle}</Text>
            </View>
          </View>

          <View style={styles.pointConnectorLine} />

          <View style={styles.pointRow}>
            <View style={styles.destIndicatorSquare} />
            <View style={styles.pointTextContainer}>
              <Text style={styles.pointLabel}>DESTINATION</Text>
              <Text style={styles.pointName}>{selectedCorridor.destination.name}</Text>
              <Text style={styles.pointSubtitle}>{selectedCorridor.destination.subtitle}</Text>
            </View>
          </View>
        </View>

        {/* 1.35x CONSTRAINT ENGINE BENCHMARK (REQUIREMENT 6) */}
        <View style={styles.constraintBanner}>
          <View style={styles.constraintHeader}>
            <View style={styles.constraintIconBox}>
              <Text style={styles.constraintIcon}>⚡</Text>
            </View>
            <View style={styles.constraintHeaderText}>
              <Text style={styles.constraintTitle}>SauraRoute 1.35× Detour Engine</Text>
              <Text style={styles.constraintSubtitle}>
                Baseline: {fastestDistance} km • {formatDuration(fastestTime)}
              </Text>
            </View>
          </View>

          <View style={styles.constraintLimitsRow}>
            <View style={styles.constraintLimitItem}>
              <Text style={styles.constraintLimitLabel}>MAX DISTANCE (≤ 1.35×)</Text>
              <Text style={styles.constraintLimitVal}>{maxDistance135} km</Text>
            </View>
            <View style={styles.constraintLimitDivider} />
            <View style={styles.constraintLimitItem}>
              <Text style={styles.constraintLimitLabel}>MAX TRAVEL TIME (≤ 1.35×)</Text>
              <Text style={styles.constraintLimitVal}>{formatDuration(maxTime135)}</Text>
            </View>
          </View>
        </View>

        {/* 3 CANDIDATE ROUTES (LOW / MEDIUM / HIGH RISK OPTIONS) */}
        <View style={styles.candidatesSection}>
          <Text style={styles.sectionLabel}>
            CHOOSE ROUTE BY RISK (3 OPTIONS):
          </Text>

          {/* 3-WAY RISK SELECTOR: LOW, MEDIUM, HIGH */}
          <View style={styles.strategySegmentBar}>
            <TouchableOpacity
              style={[
                styles.strategySegmentBtn,
                (selectedCandidate?.kind === 'low' || selectedCandidate?.kind === 'safe') && styles.strategyBtnSafeActive,
              ]}
              onPress={() => {
                const sIdx = evaluatedRoutes.findIndex((r) => r.kind === 'low' || r.kind === 'safe');
                if (sIdx >= 0) selectRoute(sIdx);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.strategyBtnIcon}>🟢</Text>
              <Text
                style={[
                  styles.strategyBtnTitle,
                  (selectedCandidate?.kind === 'low' || selectedCandidate?.kind === 'safe') && styles.strategyBtnTitleActive,
                ]}
              >
                LOW RISK
              </Text>
              <Text style={styles.strategyBtnSub}>Recommended</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.strategySegmentBtn,
                selectedCandidate?.kind === 'medium' && styles.strategyBtnMediumActive,
              ]}
              onPress={() => {
                const mIdx = evaluatedRoutes.findIndex((r) => r.kind === 'medium');
                if (mIdx >= 0) selectRoute(mIdx);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.strategyBtnIcon}>🟡</Text>
              <Text
                style={[
                  styles.strategyBtnTitle,
                  selectedCandidate?.kind === 'medium' && styles.strategyBtnTitleActive,
                ]}
              >
                MEDIUM
              </Text>
              <Text style={styles.strategyBtnSub}>Balanced</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.strategySegmentBtn,
                (selectedCandidate?.kind === 'high' || selectedCandidate?.kind === 'fastest') && styles.strategyBtnHighActive,
              ]}
              onPress={() => {
                const fIdx = evaluatedRoutes.findIndex((r) => r.kind === 'high' || r.kind === 'fastest');
                if (fIdx >= 0) selectRoute(fIdx);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.strategyBtnIcon}>🔴</Text>
              <Text
                style={[
                  styles.strategyBtnTitle,
                  (selectedCandidate?.kind === 'high' || selectedCandidate?.kind === 'fastest') && styles.strategyBtnTitleActive,
                ]}
              >
                HIGH RISK
              </Text>
              <Text style={styles.strategyBtnSub}>Direct Track</Text>
            </TouchableOpacity>
          </View>

          {evaluatedRoutes.map((candidate: EvaluatedRouteOption, idx: number) => {
            const isSelected = idx === selectedRouteIndex;
            const isRec = candidate.isRecommended || candidate.kind === 'low' || candidate.kind === 'safe';
            const isClosed = candidate.accessibilityStatus === 'CLOSED';
            const isRestricted = candidate.accessibilityStatus === 'RESTRICTED';

            const statusColor = isClosed
              ? colors.danger
              : isRestricted
              ? colors.warning
              : colors.functionalGreen;

            const riskBg =
              candidate.riskLevel === 'LOW'
                ? 'rgba(16, 185, 129, 0.12)'
                : candidate.riskLevel === 'MEDIUM'
                ? 'rgba(245, 158, 11, 0.12)'
                : 'rgba(239, 68, 68, 0.12)';

            const riskTextColor =
              candidate.riskLevel === 'LOW'
                ? colors.functionalGreen
                : candidate.riskLevel === 'MEDIUM'
                ? colors.warning
                : colors.danger;

            return (
              <TouchableOpacity
                key={candidate.id}
                style={[
                  styles.routeCard,
                  isSelected && styles.routeCardSelected,
                  isClosed && styles.routeCardClosed,
                ]}
                onPress={() => selectRoute(idx)}
                activeOpacity={0.85}
              >
                {/* TOP BADGE ROW */}
                <View style={styles.cardTopRow}>
                  {candidate.kind === 'low' || candidate.kind === 'safe' ? (
                    <View style={styles.safeBadge}>
                      <Text style={styles.safeBadgeText}>
                        🟢 LOW RISK (RECOMMENDED)
                      </Text>
                    </View>
                  ) : candidate.kind === 'medium' ? (
                    <View style={styles.mediumBadge}>
                      <Text style={styles.mediumBadgeText}>
                        🟡 MEDIUM RISK (BALANCED)
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.highRiskBadge}>
                      <Text style={styles.highRiskBadgeText}>
                        🔴 HIGH RISK (DIRECT)
                      </Text>
                    </View>
                  )}


                  {/* Radio / Selection Circle */}
                  <View
                    style={[
                      styles.selectionRadio,
                      isSelected && styles.selectionRadioActive,
                    ]}
                  >
                    {isSelected && <View style={styles.selectionRadioDot} />}
                  </View>
                </View>

                {/* ROUTE TITLE & VIA */}
                <Text style={styles.routeCardTitle}>{candidate.name}</Text>
                <Text style={styles.routeCardVia}>{candidate.via}</Text>

                {/* PRIMARY METRICS ROW (Distance, Time, Risk, Accessibility) */}
                <View style={styles.metricsGrid}>
                  <View style={styles.metricCell}>
                    <Text style={styles.metricVal}>{candidate.distanceKm} km</Text>
                    <Text style={styles.metricLabel}>Distance</Text>
                  </View>
                  <View style={styles.metricCellDivider} />
                  <View style={styles.metricCell}>
                    <Text style={styles.metricVal}>
                      {formatDuration(candidate.durationMinutes)}
                    </Text>
                    <Text style={styles.metricLabel}>Est. Time</Text>
                  </View>
                  <View style={styles.metricCellDivider} />
                  <View style={styles.metricCell}>
                    <View style={[styles.riskPill, { backgroundColor: riskBg }]}>
                      <Text style={[styles.riskPillText, { color: riskTextColor }]}>
                        {candidate.riskLevel} RISK ({candidate.safetyScore})
                      </Text>
                    </View>
                    <Text style={styles.metricLabel}>Safety Score</Text>
                  </View>
                  <View style={styles.metricCellDivider} />
                  <View style={styles.metricCell}>
                    <View
                      style={[
                        styles.statusPillBadge,
                        { borderColor: statusColor },
                      ]}
                    >
                      <View
                        style={[styles.statusDot, { backgroundColor: statusColor }]}
                      />
                      <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                        {candidate.accessibilityStatus}
                      </Text>
                    </View>
                    <Text style={styles.metricLabel}>Accessibility</Text>
                  </View>
                </View>

                {/* 1.35x CONSTRAINT STATUS PILLS */}
                <View style={styles.constraintPillsRow}>
                  <View
                    style={[
                      styles.constraintPill,
                      candidate.metrics.withinDistanceConstraint
                        ? styles.constraintPillPass
                        : styles.constraintPillFail,
                    ]}
                  >
                    <Text style={styles.constraintPillText}>
                      {candidate.metrics.withinDistanceConstraint
                        ? '✓ Distance ≤ 1.35×'
                        : '✗ Distance > 1.35×'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.constraintPill,
                      candidate.metrics.withinTimeConstraint
                        ? styles.constraintPillPass
                        : styles.constraintPillFail,
                    ]}
                  >
                    <Text style={styles.constraintPillText}>
                      {candidate.metrics.withinTimeConstraint
                        ? '✓ Time ≤ 1.35×'
                        : '✗ Time > 1.35×'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.constraintPill,
                      candidate.metrics.isViable
                        ? styles.constraintPillPass
                        : styles.constraintPillFail,
                    ]}
                  >
                    <Text style={styles.constraintPillText}>
                      {candidate.metrics.isViable ? '✓ Viable' : '✗ Impassable'}
                    </Text>
                  </View>
                </View>

                {/* DYNAMIC "WHY THIS ROUTE?" (REQUIREMENT 5) */}
                <View style={styles.whyBox}>
                  <Text style={styles.whyTitle}>
                    {isRec ? 'Why this route? (Recommended)' : 'Route Analysis:'}
                  </Text>
                  {candidate.whyThisRouteBullets.map((bullet, bIdx) => (
                    <Text key={bIdx} style={styles.whyBullet}>
                      {bullet}
                    </Text>
                  ))}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* STICKY BOTTOM "START DRIVING" BAR (MOMENT 2) */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) + 6 }]}>
        <View style={styles.bottomBarInfo}>
          <Text style={styles.bottomRouteName} numberOfLines={1}>
            {selectedCandidate.name}
          </Text>
          <Text style={styles.bottomRouteStats}>
            {selectedCandidate.distanceKm} km • {formatDuration(selectedCandidate.durationMinutes)} • {selectedCandidate.accessibilityStatus}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.startDrivingBtn,
            selectedCandidate.accessibilityStatus === 'CLOSED' && styles.startDrivingBtnDisabled,
          ]}
          onPress={handleStartDriving}
          disabled={selectedCandidate.accessibilityStatus === 'CLOSED'}
          activeOpacity={0.85}
        >
          <Text style={styles.startDrivingBtnText}>
            {selectedCandidate.accessibilityStatus === 'CLOSED'
              ? 'ROAD CLOSED'
              : 'Start Driving →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backArrow: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  headerTitles: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  demoBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: 8,
  },
  demoBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  corridorSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  corridorPillsRow: {
    gap: 8,
  },
  corridorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    gap: 6,
    ...shadows.subtle,
  },
  corridorPillActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  corridorPillIcon: {
    fontSize: 14,
  },
  corridorPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  corridorPillTextActive: {
    color: '#FFFFFF',
  },
  routePointsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  originIndicatorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.brand,
    marginTop: 4,
    marginRight: 10,
  },
  destIndicatorSquare: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.danger,
    marginTop: 4,
    marginRight: 10,
  },
  pointConnectorLine: {
    width: 2,
    height: 18,
    backgroundColor: colors.border,
    marginLeft: 5,
    marginVertical: 2,
  },
  pointTextContainer: {
    flex: 1,
  },
  pointLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  pointName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pointSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  constraintBanner: {
    backgroundColor: '#0F172A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  constraintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  constraintIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  constraintIcon: {
    fontSize: 14,
  },
  constraintHeaderText: {
    flex: 1,
  },
  constraintTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  constraintSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  constraintLimitsRow: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: radius.sm,
    padding: 8,
    marginTop: 4,
  },
  constraintLimitItem: {
    flex: 1,
    alignItems: 'center',
  },
  constraintLimitDivider: {
    width: 1,
    backgroundColor: '#334155',
  },
  constraintLimitLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  constraintLimitVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F59E0B',
    marginTop: 2,
  },
  candidatesSection: {
    marginBottom: spacing.md,
  },
  routeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  routeCardSelected: {
    borderColor: colors.brand,
    backgroundColor: '#F8FAFC',
  },
  routeCardClosed: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  strategySegmentBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  strategySegmentBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  strategyBtnSafeActive: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  strategyBtnMediumActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  strategyBtnFastestActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  strategyBtnHighActive: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  strategyBtnIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  strategyBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.3,
  },
  strategyBtnTitleActive: {
    color: colors.textPrimary,
  },
  strategyBtnSub: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1,
  },
  safeBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  safeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  mediumBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  mediumBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  highRiskBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  highRiskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },
  fastestBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  fastestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#1D4ED8',
  },

  recommendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  recommendedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  shortestBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  shortestBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  closedBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  closedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B91C1C',
  },

  selectionRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionRadioActive: {
    borderColor: colors.brand,
  },
  selectionRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  routeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  routeCardVia: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricCellDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  riskPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  riskPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    gap: 4,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  constraintPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  constraintPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  constraintPillPass: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  constraintPillFail: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  constraintPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  whyBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: radius.sm,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand,
  },
  whyTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  whyBullet: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginVertical: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  bottomBarInfo: {
    flex: 1,
    marginRight: 12,
  },
  bottomRouteName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  bottomRouteStats: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  startDrivingBtn: {
    backgroundColor: colors.brand,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.pill,
    ...shadows.subtle,
  },
  startDrivingBtnDisabled: {
    backgroundColor: colors.border,
  },
  startDrivingBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
  },
});
