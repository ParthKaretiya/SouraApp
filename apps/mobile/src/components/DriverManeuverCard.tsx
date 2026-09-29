import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, shadows } from '../theme';
import type { RouteManeuverStep } from '../types/route';

interface DriverManeuverCardProps {
  step: RouteManeuverStep;
}

export const DriverManeuverCard: React.FC<DriverManeuverCardProps> = ({ step }) => {
  const { t } = useTranslation();

  const getManeuverIcon = () => {
    switch (step.maneuverType) {
      case 'turn-left':
        return '↰';
      case 'turn-right':
        return '↱';
      case 'keep-left':
        return '↖';
      case 'keep-right':
        return '↗';
      case 'destination':
        return '⚑';
      case 'straight':
      default:
        return '↑';
    }
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${meters} m`;
  };

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>{getManeuverIcon()}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.distanceText}>
          {t('inDistance', { dist: formatDistance(step.distanceMeters), defaultValue: `In ${formatDistance(step.distanceMeters)}` })}
        </Text>
        <Text style={styles.instructionText} numberOfLines={2}>
          {step.instruction}
        </Text>
        {step.roadName ? (
          <View style={styles.roadBadge}>
            <Text style={styles.roadText}>{step.roadName}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: spacing.md,
    ...shadows.card,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
    color: colors.textDark,
    fontWeight: '900',
  },
  textContainer: {
    flex: 1,
  },
  distanceText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.functionalGreen,
    marginBottom: 1,
  },
  instructionText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 20,
  },
  roadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 3,
  },
  roadText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});

