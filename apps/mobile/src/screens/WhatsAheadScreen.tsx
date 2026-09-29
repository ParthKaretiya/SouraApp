import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, layout, shadows } from '../theme';
import { DriverHeader } from '../components/DriverHeader';
import { DriverBottomNav } from '../components/DriverBottomNav';
import { useDemo } from '../context/DemoContext';
import type { Hazard, HazardType } from '../data/demoScenarioData';
import type { WhatsAheadScreenProps } from '../types/navigation';

export const WhatsAheadScreen: React.FC<WhatsAheadScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { selectedCorridor, hazards } = useDemo();
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  // Programmatically sorted by distanceAheadKm ascending (Requirement 11)
  const sortedHazards = [...hazards].sort((a, b) => a.distanceAheadKm - b.distanceAheadKm);

  const filteredItems = sortedHazards.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    return item.severity === selectedFilter;
  });

  const criticalCount = hazards.filter((i) => i.severity === 'CRITICAL').length;
  const warningCount = hazards.filter((i) => i.severity === 'WARNING').length;

  const getHazardIcon = (type: HazardType) => {
    switch (type) {
      case 'LANDSLIDE':
        return '⛰️';
      case 'ROCKFALL':
        return '🪨';
      case 'FLOOD':
        return '🌊';
      case 'FOG':
        return '🌫️';
      case 'ACCIDENT':
        return '💥';
      case 'ROAD_RESTRICTION':
      default:
        return '🚧';
    }
  };

  const getSeverityBadge = (severity: Hazard['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return {
          bg: '#FEE2E2',
          border: '#FCA5A5',
          text: '#991B1B',
          label: 'CRITICAL HAZARD',
        };
      case 'WARNING':
        return {
          bg: '#FEF3C7',
          border: '#FCD34D',
          text: '#92400E',
          label: 'ADVISORY WARNING',
        };
      case 'INFO':
      default:
        return {
          bg: '#E0F2FE',
          border: '#BAE6FD',
          text: '#0369A1',
          label: 'CORRIDOR NOTICE',
        };
    }
  };

  return (
    <View style={styles.container}>
      <DriverHeader
        title={t('whatsAhead', "What's Ahead")}
        subtitle={selectedCorridor.corridorName}
        statusText={`${hazards.length} HAZARDS RADAR`}
        statusType={criticalCount > 0 ? 'danger' : warningCount > 0 ? 'warning' : 'success'}
        showBack={true}
        onBackPress={() => navigation.goBack()}
        onSosPress={() => navigation.navigate('Sos')}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SUMMARY HERO BAR */}
        <View style={styles.heroSummaryCard}>
          <View style={styles.heroTextCol}>
            <Text style={styles.heroTitle}>{selectedCorridor.corridorName}</Text>
            <Text style={styles.heroSubtitle}>
              Hazards ordered chronologically by distance ahead
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{hazards.length} Active</Text>
          </View>
        </View>

        {/* FILTER TABS */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, selectedFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setSelectedFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'ALL' && styles.filterChipTextActive,
              ]}
            >
              All ({hazards.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'CRITICAL' && styles.filterChipActiveCritical,
            ]}
            onPress={() => setSelectedFilter('CRITICAL')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'CRITICAL' && styles.filterChipTextActiveCritical,
              ]}
            >
              🚨 Critical ({criticalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedFilter === 'WARNING' && styles.filterChipActiveWarning,
            ]}
            onPress={() => setSelectedFilter('WARNING')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterChipText,
                selectedFilter === 'WARNING' && styles.filterChipTextActiveWarning,
              ]}
            >
              ⚠ Warnings ({warningCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* CHRONOLOGICAL HAZARD FEED (MOMENT 3) */}
        <View style={styles.listContainer}>
          {filteredItems.map((item, idx) => {
            const badge = getSeverityBadge(item.severity);
            const icon = getHazardIcon(item.type);

            return (
              <View
                key={item.id}
                style={[
                  styles.hazardCard,
                  item.severity === 'CRITICAL' && styles.hazardCardCritical,
                ]}
              >
                {/* DISTANCE AHEAD HEADER CHIP */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.distanceAheadPill}>
                    <Text style={styles.distanceAheadIcon}>📍</Text>
                    <Text style={styles.distanceAheadVal}>
                      {item.distanceAheadKm.toFixed(1)} km ahead
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.severityBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}
                  >
                    <Text style={[styles.severityBadgeText, { color: badge.text }]}>
                      {badge.label}
                    </Text>
                  </View>
                </View>

                {/* TITLE & ICON */}
                <View style={styles.titleRow}>
                  <Text style={styles.hazardIcon}>{icon}</Text>
                  <View style={styles.titleCol}>
                    <Text style={styles.hazardName}>{item.name || item.title}</Text>
                    <Text style={styles.hazardTypeTag}>TYPE: {item.type} • {item.status}</Text>
                  </View>
                </View>

                {/* DESCRIPTION */}
                <Text style={styles.hazardDesc}>{item.description}</Text>

                {/* LOCATION & TIMESTAMP */}
                <View style={styles.footerRow}>
                  <Text style={styles.locationText} numberOfLines={1}>
                    🛣️ {item.locationText}
                  </Text>
                  <Text style={styles.reportedAtText}>{item.reportedAt}</Text>
                </View>

                {/* COORDINATES STAMP */}
                <View style={styles.coordStrip}>
                  <Text style={styles.coordStripText}>
                    GPS: {item.coordinates[1].toFixed(4)}° N, {item.coordinates[0].toFixed(4)}° E
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <DriverBottomNav
        activeTab="ahead"
        onNavigate={(tab) => {
          if (tab === 'home') navigation.navigate('DriverHome');
          if (tab === 'trip') navigation.navigate('Trip');
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
    padding: spacing.md,
    paddingBottom: 90,
  },
  heroSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  heroTextCol: {
    flex: 1,
    marginRight: 10,
  },
  heroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  heroBadge: {
    backgroundColor: colors.brand,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000000',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipActiveCritical: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  filterChipActiveWarning: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipTextActiveCritical: {
    color: '#FFFFFF',
  },
  filterChipTextActiveWarning: {
    color: '#000000',
  },
  listContainer: {
    gap: spacing.md,
  },
  hazardCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    ...shadows.card,
  },
  hazardCardCritical: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFF8F8',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceAheadPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    gap: 4,
  },
  distanceAheadIcon: {
    fontSize: 11,
  },
  distanceAheadVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  severityBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  severityBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  hazardIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  titleCol: {
    flex: 1,
  },
  hazardName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  hazardTypeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: 1,
  },
  hazardDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: 8,
  },
  locationText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
    marginRight: 8,
  },
  reportedAtText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  coordStrip: {
    marginTop: 4,
  },
  coordStripText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
});
