import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../theme';

interface DriverEtaBarProps {
  remainingTime: string;
  remainingDistance: string;
  destinationName: string;
  progressPercent?: number; // 0 to 100
  corridorStatus?: 'OPEN' | 'RESTRICTED' | 'CLOSED';
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const DriverEtaBar: React.FC<DriverEtaBarProps> = ({
  remainingTime,
  remainingDistance,
  destinationName,
  progressPercent = 15,
  corridorStatus = 'OPEN',
  riskLevel = 'LOW',
}) => {
  const { t } = useTranslation();

  // Calculate dynamic arrival time
  const now = new Date();
  const arrivalDate = new Date(now.getTime() + 165 * 60000);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusBg =
    corridorStatus === 'CLOSED'
      ? colors.danger
      : corridorStatus === 'RESTRICTED'
      ? colors.warning
      : colors.functionalGreen;

  return (
    <View style={styles.container}>
      {/* Sleek Progress Track */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressBar, { width: `${Math.min(100, Math.max(0, progressPercent))}%` }]} />
      </View>

      {/* MOMENT 2: COMPACT CORRIDOR STATUS & RISK STRIP */}
      <View style={styles.statusStripRow}>
        <View style={[styles.statusStripDot, { backgroundColor: statusBg }]} />
        <Text style={[styles.statusStripText, { color: statusBg }]}>
          {corridorStatus === 'CLOSED'
            ? 'CORRIDOR CLOSED • DETOUR MANDATORY'
            : `CORRIDOR ${corridorStatus} • ${riskLevel} RISK`}
        </Text>
      </View>

      <View style={styles.row}>
        {/* Remaining Time */}
        <View style={styles.metricBlock}>
          <Text style={styles.mainValue}>{remainingTime}</Text>
          <Text style={styles.subLabel}>{t('remaining', 'Remaining')}</Text>
        </View>

        <View style={styles.divider} />

        {/* Distance */}
        <View style={styles.metricBlock}>
          <Text style={styles.secondaryValue}>{remainingDistance}</Text>
          <Text style={styles.subLabel}>{t('distance', 'Distance')}</Text>
        </View>

        <View style={styles.divider} />

        {/* ETA Clock */}
        <View style={styles.metricBlock}>
          <Text style={styles.secondaryValue}>{arrivalTimeStr}</Text>
          <Text style={styles.subLabel}>{t('arrival', 'Arrival')}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  progressTrack: {
    height: 3,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.brand,
    borderRadius: radius.pill,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  metricBlock: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 22,
    backgroundColor: colors.borderSubtle,
  },
  mainValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.functionalGreen,
    letterSpacing: 0.2,
  },
  secondaryValue: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  subLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: 2,
  },
  statusStripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 3,
    marginBottom: 4,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
  },
  statusStripDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusStripText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

