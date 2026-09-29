import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius } from '../theme';
import { Icon, IconName } from './common/Icon';

export type DriverNavTab = 'home' | 'trip' | 'ahead' | 'report' | 'sos';

interface DriverBottomNavProps {
  activeTab: DriverNavTab;
  onNavigate: (tab: DriverNavTab) => void;
}

export const DriverBottomNav: React.FC<DriverBottomNavProps> = ({
  activeTab,
  onNavigate,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const tabs: { key: DriverNavTab; labelKey: string; defaultLabel: string; icon: IconName; isDanger?: boolean }[] = [
    { key: 'home', labelKey: 'home', defaultLabel: 'Home', icon: 'home' },
    { key: 'trip', labelKey: 'trip', defaultLabel: 'Trip', icon: 'trip' },
    { key: 'ahead', labelKey: 'ahead', defaultLabel: 'Ahead', icon: 'ahead' },
    { key: 'report', labelKey: 'report', defaultLabel: 'Report', icon: 'report' },
    { key: 'sos', labelKey: 'sos', defaultLabel: 'SOS', icon: 'sos', isDanger: true },
  ];

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 4) }]}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        const label = t(tab.labelKey, tab.defaultLabel);

        const iconColor = tab.isDanger
          ? colors.danger
          : isActive
          ? colors.brandDark
          : colors.textMuted;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onNavigate(tab.key)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            {isActive && (
              <View
                style={[
                  styles.activeIndicator,
                  tab.isDanger && styles.activeDangerIndicator,
                ]}
              />
            )}
            <View style={styles.iconWrapper}>
              <Icon name={tab.icon} size={18} color={iconColor} />
            </View>
            <Text
              style={[
                styles.tabLabel,
                isActive && styles.activeTabLabel,
                tab.isDanger && styles.dangerTabLabel,
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 62,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 48,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -4,
    width: 20,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.brand,
  },
  activeDangerIndicator: {
    backgroundColor: colors.danger,
  },
  iconWrapper: {
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  dangerTabLabel: {
    color: colors.danger,
    fontWeight: '700',
  },
});
