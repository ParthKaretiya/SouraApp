import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius, shadows } from '../theme';

interface DriverSafetyBannerProps {
  severity?: 'WARNING' | 'CRITICAL' | 'INFO';
  message: string;
  locationName?: string;
  onPressDetails?: () => void;
}

export const DriverSafetyBanner: React.FC<DriverSafetyBannerProps> = ({
  severity = 'WARNING',
  message,
  locationName,
  onPressDetails,
}) => {
  const isCritical = severity === 'CRITICAL';
  const isInfo = severity === 'INFO';

  const bannerBg = isCritical
    ? '#FEE2E2'
    : isInfo
    ? '#EFF6FF'
    : '#FEF3C7';

  const borderColor = isCritical
    ? '#FCA5A5'
    : isInfo
    ? '#BFDBFE'
    : '#FDE68A';

  const iconGlyph = isCritical ? '🛑' : isInfo ? 'ℹ' : '⚠';

  const textColor = isCritical
    ? colors.danger
    : isInfo
    ? colors.accent
    : '#B45309';

  const severityTitle = isCritical
    ? 'Critical advisory'
    : isInfo
    ? 'Information'
    : 'Warning advisory';

  return (
    <View style={[styles.container, { backgroundColor: bannerBg, borderColor }]}>
      <Text style={[styles.icon, { color: textColor }]}>{iconGlyph}</Text>
      <View style={styles.textContainer}>
        <View style={styles.badgeRow}>
          <Text style={[styles.severityBadge, { color: textColor }]}>
            {severityTitle}
          </Text>
          {locationName && (
            <Text style={styles.locationText} numberOfLines={1}>
              • {locationName}
            </Text>
          )}
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>

      {onPressDetails && (
        <TouchableOpacity
          style={[styles.detailsBtn, { borderColor: textColor }]}
          onPress={onPressDetails}
          activeOpacity={0.7}
        >
          <Text style={[styles.detailsText, { color: textColor }]}>View</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.xs,
    gap: spacing.sm,
    ...shadows.subtle,
  },
  icon: {
    fontSize: 16,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 2,
  },
  severityBadge: {
    fontSize: 11,
    fontWeight: '800',
  },
  locationText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  message: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 18,
  },
  detailsBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  detailsText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

