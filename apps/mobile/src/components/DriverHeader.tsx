import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, layout, shadows } from '../theme';
import { LanguageSwitcher } from './LanguageSwitcher';

interface DriverHeaderProps {
  title?: string;
  subtitle?: string;
  statusText?: string;
  statusType?: 'success' | 'warning' | 'danger';
  onSosPress?: () => void;
  showSos?: boolean;
  showBack?: boolean;
  onBackPress?: () => void;
}

export const DriverHeader: React.FC<DriverHeaderProps> = ({
  title,
  subtitle,
  statusText = 'READY',
  statusType = 'success',
  onSosPress,
  showSos = true,
  showBack = false,
  onBackPress,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const displayTitle = title || t('appTitle', 'SauraRoute');
  const displaySubtitle = subtitle || t('driverCockpit', 'Driver Cockpit');
  const displayStatus = statusText === 'READY' ? t('ready', 'Ready') : statusText;

  const getBadgeColor = () => {
    switch (statusType) {
      case 'warning':
        return colors.warning;
      case 'danger':
        return colors.danger;
      case 'success':
      default:
        return colors.functionalGreen;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 8) + 6 }]}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          {showBack && onBackPress && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={onBackPress}
              accessibilityRole="button"
              accessibilityLabel="Go back / exit navigation"
              activeOpacity={0.7}
            >
              <Text style={styles.backBtnArrow}>←</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.title} numberOfLines={1}>
            {displayTitle}
          </Text>
          <View style={styles.brandDot} />

          {/* REQUIREMENT 24: DEMO MODE BADGE */}
          <View style={styles.demoModeBadge}>
            <Text style={styles.demoModeBadgeText}>DEMO MODE</Text>
          </View>
        </View>

        <Text style={styles.subtitle} numberOfLines={1}>
          {displaySubtitle}
        </Text>

        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: getBadgeColor() }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            {displayStatus}
          </Text>
        </View>
      </View>

      <View style={styles.rightActions}>
        <LanguageSwitcher />

        {showSos && onSosPress && (
          <TouchableOpacity
            style={styles.sosButton}
            onPress={onSosPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Emergency SOS Button"
          >
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  left: {
    flex: 1,
    marginRight: spacing.sm,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  backBtnArrow: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  brandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brand,
    marginTop: 2,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 5,
    marginTop: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sosButton: {
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm + 2,
    minHeight: 42,
    minWidth: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.subtle,
  },
  sosText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  demoModeBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginLeft: 6,
    alignSelf: 'center',
  },
  demoModeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
