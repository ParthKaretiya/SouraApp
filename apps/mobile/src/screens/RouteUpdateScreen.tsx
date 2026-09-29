import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, layout, shadows } from '../theme';
import { DriverHeader } from '../components/DriverHeader';
import { useDemo } from '../context/DemoContext';
import type { RerouteResponse } from '../api/types';
import type { RouteUpdateScreenProps } from '../types/navigation';

export const RouteUpdateScreen: React.FC<RouteUpdateScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { selectedCorridor, acceptReroute } = useDemo();

  const demoReroute = selectedCorridor.dynamicRerouteScenario.rerouteData;
  const [rerouteData] = useState<RerouteResponse>(route.params?.rerouteData || demoReroute);
  const isLoading = false;

  const handleAcceptRoute = () => {
    acceptReroute();
    navigation.navigate('Trip');
  };

  const handleKeepCurrent = () => {
    navigation.goBack();
  };

  const reason =
    route.params?.reason ||
    rerouteData?.reason ||
    'Hazard clearing & mudslide risk reported near Byrnihat stretch.';

  const timeSaved = rerouteData?.metrics?.timeSavedMinutes || 17;
  const riskReduction = rerouteData?.metrics?.riskReductionPercent || 28;

  return (
    <View style={styles.container}>
      <DriverHeader
        title={t('routeAdvisory', 'Route Advisory')}
        subtitle={t('dynamicRerouteAvailable', 'Dynamic Reroute Available')}
        statusText={t('rerouteSuggested', 'Reroute suggested')}
        statusType="warning"
        onSosPress={() => navigation.navigate('Sos')}
      />

      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.brand} />
            <Text style={styles.loadingText}>{t('calculatingAlternative', 'Calculating alternative safe corridor paths...')}</Text>
          </View>
        ) : (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <View style={styles.iconCircle}>
                <Text style={styles.alertIcon}>⚠</Text>
              </View>
              <View style={styles.alertHeaderText}>
                <Text style={styles.alertTitle}>{t('fasterSaferDetected', 'Faster & safer route detected')}</Text>
                <Text style={styles.alertSubtitle}>{t('corridorOptimization', 'AI corridor optimization & hazard bypass')}</Text>
              </View>
            </View>

            {/* Why Reroute Reason */}
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>{t('whyDiversify', 'Why diversify:')}</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>

            {/* Side-by-side comparison */}
            <View style={styles.comparisonRow}>
              <View style={styles.comparisonBox}>
                <Text style={styles.compLabel}>{t('currentRoute', 'Current route')}</Text>
                <Text style={styles.compTime}>2h 45m</Text>
                <Text style={styles.compRisk}>{t('highHazardRisk', 'High hazard risk')}</Text>
                <Text style={styles.compDist}>98.4 km (NH-6)</Text>
              </View>

              <View style={[styles.comparisonBox, styles.recBox]}>
                <View style={styles.recBadge}>
                  <Text style={styles.recBadgeText}>{t('recommended', 'Recommended')}</Text>
                </View>
                <Text style={[styles.compTime, styles.recTime]}>2h 28m</Text>
                <Text style={[styles.compRisk, styles.recRisk]}>
                  {t('saferMetrics', { min: timeSaved, pct: riskReduction, defaultValue: `-${timeSaved} min • ${riskReduction}% Safer` })}
                </Text>
                <Text style={styles.recDist}>96.2 km (Bypass)</Text>
              </View>
            </View>

            {/* Highlights */}
            <View style={styles.highlightsContainer}>
              <Text style={styles.highlightItem}>{t('bypassesRock', '✓ Bypasses slow-moving rock clearance')}</Text>
              <Text style={styles.highlightItem}>{t('verifiedOpen', '✓ Verified open by corridor monitoring')}</Text>
              <Text style={styles.highlightItem}>{t('minimalElevation', '✓ Minimal elevation steepness (+48m)')}</Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAcceptRoute}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Accept Recommended Route"
            >
              <Text style={styles.acceptButtonText}>{t('acceptNewRoute', 'Accept new route →')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.keepButton}
              onPress={handleKeepCurrent}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Keep Current Route"
            >
              <Text style={styles.keepButtonText}>{t('keepCurrentRoute', 'Keep current route')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    ...shadows.card,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertIcon: {
    fontSize: 20,
    color: '#B45309',
    fontWeight: '700',
  },
  alertHeaderText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  alertSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  reasonBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  reasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  comparisonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  comparisonBox: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  recBox: {
    borderColor: colors.functionalGreen,
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
  },
  recBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.functionalGreen,
  },
  compLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 4,
  },
  compTime: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recTime: {
    color: colors.functionalGreen,
  },
  compRisk: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.danger,
    marginTop: 2,
  },
  recRisk: {
    color: colors.functionalGreen,
    fontWeight: '700',
  },
  compDist: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  recDist: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  highlightsContainer: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.lg,
    gap: 6,
  },
  highlightItem: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: colors.brand,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  acceptButtonText: {
    color: colors.textDark,
    fontWeight: '800',
    fontSize: 16,
  },
  keepButton: {
    backgroundColor: colors.surfaceSecondary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: layout.minTouchTarget,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  keepButtonText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },
});

