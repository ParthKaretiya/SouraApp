import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, layout, shadows } from '../theme';
import { DriverHeader } from '../components/DriverHeader';
import { DriverBottomNav } from '../components/DriverBottomNav';
import { Icon } from '../components/common/Icon';
import { apiClient } from '../api';
import type { RouteData } from '../types/route';
import type { WeatherResponse, RouteRiskResponse, AccessibilityResponse } from '../api/types';
import type { DriverHomeScreenProps } from '../types/navigation';

import { useDemo } from '../context/DemoContext';

export const HomeScreen: React.FC<DriverHomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const {
    corridors,
    selectedCorridorId,
    selectedCorridor,
    setCorridor,
    activeRoute,
    activeCorridorStatus,
    activeRiskScore,
    activeRiskLevel,
    hazards,
    resetDemo,
  } = useDemo();

  const [hasActiveTrip, setHasActiveTrip] = useState(true);

  const originName = selectedCorridor.origin.name;
  const destName = selectedCorridor.destination.name;
  const corridorName = selectedCorridor.corridorName;
  const distanceKm = activeRoute.distanceKm;
  const durationMin = activeRoute.durationMinutes;
  const hours = Math.floor(durationMin / 60);
  const mins = durationMin % 60;
  const durationText = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  const weatherTemp = '24°C';
  const weatherCond = 'Partly Cloudy';
  const riskLevel = activeRiskLevel;
  const safetyScore = `${activeRiskScore} / 100`;
  const accessStatus =
    activeCorridorStatus === 'OPEN'
      ? 'All sections open'
      : activeCorridorStatus === 'RESTRICTED'
      ? 'Restricted commercial transit'
      : 'Road CLOSED • Detour active';

  return (
    <View style={styles.container}>
      <DriverHeader
        title={t('appTitle', 'SauraRoute')}
        subtitle={t('driverCockpit', 'Driver Cockpit')}
        statusText="DEMO READY"
        statusType="success"
        onSosPress={() => navigation.navigate('Sos')}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subtle State Simulator Bar */}
        <View style={styles.stateToggleBar}>
          <Text style={styles.stateToggleLabel}>{t('stateSimulator', 'Simulator')}:</Text>
          <TouchableOpacity
            style={[styles.togglePill, hasActiveTrip && styles.togglePillActive]}
            onPress={() => setHasActiveTrip(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, hasActiveTrip && styles.toggleTextActive]}>
              {t('activeTrip', 'Active trip')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.togglePill, !hasActiveTrip && styles.togglePillActive]}
            onPress={() => setHasActiveTrip(false)}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, !hasActiveTrip && styles.toggleTextActive]}>
              {t('standby', 'Standby')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetQuickBtn}
            onPress={resetDemo}
            activeOpacity={0.7}
          >
            <Text style={styles.resetQuickBtnText}>↻ Reset Demo</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Corridor Selection Chips (All 3 Corridors) */}
        <View style={styles.corridorBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {corridors.map((c) => {
              const isSelected = c.id === selectedCorridorId;
              const icon = c.id.includes('guwahati') ? '🏔️' : c.id.includes('dimapur') ? '🌲' : '🛣️';
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.corridorChip,
                    isSelected && styles.corridorChipActive,
                  ]}
                  onPress={() => setCorridor(c.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.corridorChipStar}>{icon}</Text>
                  <Text
                    style={[
                      styles.corridorChipText,
                      isSelected && styles.corridorChipTextActive,
                    ]}
                  >
                    {c.corridorName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {hasActiveTrip ? (
          /* ACTIVE TRIP: CLEAN PRODUCT CARD */
          <View style={styles.tripCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.corridorTitle}>{corridorName}</Text>
              <View style={styles.safetyTag}>
                <View style={styles.greenDot} />
                <Text style={styles.safetyText}>{t('safetyScoreLabel', 'Safety score')} {safetyScore}</Text>
              </View>
            </View>

            {/* Route Points */}
            <View style={styles.routePoints}>
              <View style={styles.pointRow}>
                <View style={styles.originCircle} />
                <Text style={styles.pointText}>{originName}</Text>
              </View>
              <View style={styles.routeTransitLine} />
              <View style={styles.pointRow}>
                <View style={styles.destSquare} />
                <Text style={styles.pointText}>{destName}</Text>
              </View>
            </View>

            {/* Metrics Sub-surface */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{distanceKm} km</Text>
                <Text style={styles.metricLabel}>{t('distance', 'Distance')}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{durationText}</Text>
                <Text style={styles.metricLabel}>{t('estDuration', 'Duration')}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{weatherTemp}</Text>
                <Text style={styles.metricLabel}>{t('weather', 'Weather')}</Text>
              </View>
            </View>

            {/* Action CTA Row */}
            <View style={styles.actionBtnRow}>
              <TouchableOpacity
                style={styles.planTripOutlineBtn}
                onPress={() => navigation.navigate('PlanTrip')}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Plan trip"
              >
                <Icon name="search" size={16} color={colors.textPrimary} />
                <Text style={styles.planTripOutlineBtnText}>{t('planTrip', 'Plan trip')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.startTripButton}
                onPress={() =>
                  navigation.navigate('Trip', {
                    isNavigating: true,
                    updatedRoute: activeRoute,
                  })
                }
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Start Navigation"
              >
                <Text style={styles.startTripButtonText}>{t('startNavigation', 'Start navigation')}</Text>
                <Text style={styles.buttonArrow}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* SECTION: SAFETY & CONDITIONS */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeader}>{t('corridorRisk', 'Safety & conditions')}</Text>
          <View style={styles.safetyCard}>
            <View style={styles.safetyRow}>
              <View style={styles.riskBadge}>
                <View style={styles.greenDotSmall} />
                <Text style={styles.riskBadgeText}>{riskLevel.toLowerCase()} risk</Text>
              </View>
              <Text style={styles.accessibilityText} numberOfLines={1}>
                {accessStatus}
              </Text>
            </View>

            <View style={styles.conditionDivider} />

            <View style={styles.conditionRow}>
              <Icon name="weather" size={16} color={colors.textSecondary} />
              <Text style={styles.conditionText} numberOfLines={2}>
                {weatherCond} (24°C). Corridor monitoring active for {selectedCorridor.corridorName}.
              </Text>
            </View>
          </View>
        </View>

        {/* SECTION: QUICK ACTIONS */}
        <View style={styles.sectionWrapper}>
          <Text style={styles.sectionHeader}>Quick actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('WhatsAhead')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconPill}>
                <Icon name="ahead" size={18} color={colors.warningText} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{t('whatsAhead', "What's ahead")}</Text>
                <Text style={styles.actionSubtitle}>{t('viewHazards', 'View hazards & restrictions')}</Text>
              </View>
              <Icon name="chevronRight" size={18} color={colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('ReportIssue')}
              activeOpacity={0.7}
            >
              <View style={[styles.actionIconPill, { backgroundColor: '#E0F2FE' }]}>
                <Icon name="report" size={18} color={colors.accent} />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>{t('reportIssue', 'Report road issue')}</Text>
                <Text style={styles.actionSubtitle}>{t('logIncident', 'Log incident or obstruction')}</Text>
              </View>
              <Icon name="chevronRight" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <DriverBottomNav
        activeTab="home"
        onNavigate={(tab) => {
          if (tab === 'trip') navigation.navigate('Trip');
          if (tab === 'ahead') navigation.navigate('WhatsAhead');
          if (tab === 'report') navigation.navigate('ReportIssue');
          if (tab === 'sos') navigation.navigate('Sos');
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
    padding: spacing.lg,
    paddingBottom: spacing.section + 16,
    gap: spacing.lg,
  },
  loadingBox: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  stateToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: 3,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
    gap: 2,
  },
  corridorBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  corridorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 5,
    ...shadows.subtle,
  },
  corridorChipActive: {
    backgroundColor: '#FEF3C7',
    borderColor: colors.brandDark,
  },
  corridorChipStar: {
    fontSize: 12,
  },
  corridorChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  corridorChipTextActive: {
    color: '#92400E',
  },
  stateToggleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    paddingLeft: spacing.sm,
    paddingRight: 2,
  },
  togglePill: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
  },
  togglePillActive: {
    backgroundColor: colors.surface,
    ...shadows.subtle,
  },
  toggleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  toggleTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  resetQuickBtn: {
    marginLeft: 'auto',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  resetQuickBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
  },
  tripCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    ...shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  corridorTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  safetyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.functionalGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 5,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.functionalGreen,
  },
  safetyText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.functionalGreen,
  },
  routePoints: {
    marginVertical: spacing.xs,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  originCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  destSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.functionalGreen,
  },
  routeTransitLine: {
    width: 2,
    height: 18,
    backgroundColor: colors.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  pointText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 22,
    backgroundColor: colors.border,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  planTripOutlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    minHeight: 52,
    gap: spacing.xs,
    ...shadows.subtle,
  },
  planTripOutlineBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  startTripButton: {
    flex: 1.2,
    backgroundColor: colors.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: 52,
    gap: spacing.xs,
    ...shadows.subtle,
  },
  standbyBtnRow: {
    width: '100%',
    gap: spacing.sm,
  },
  startTripButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textDark,
  },
  buttonArrow: {
    fontSize: 17,
    color: colors.textDark,
    fontWeight: '900',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: 'center',
    ...shadows.card,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 19,
  },
  assignTripButton: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: 46,
    justifyContent: 'center',
  },
  assignTripButtonText: {
    color: colors.textPrimary,
    fontWeight: '700',
    fontSize: 13,
  },
  sectionWrapper: {
    gap: spacing.xs + 2,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: 2,
  },
  safetyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.md,
    ...shadows.card,
  },
  safetyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.functionalGreenLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  greenDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.functionalGreen,
  },
  riskBadgeText: {
    color: colors.functionalGreen,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  accessibilityText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  conditionDivider: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  conditionText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  actionsContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    overflow: 'hidden',
    ...shadows.card,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  actionIconPill: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
});
