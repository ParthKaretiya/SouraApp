import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, layout, shadows } from '../theme';
import { DriverHeader } from '../components/DriverHeader';
import { DriverBottomNav } from '../components/DriverBottomNav';
import { useDemo } from '../context/DemoContext';
import { DEMO_INCIDENT_TEMPLATES } from '../data/demoScenarioData';
import type { Incident } from '../data/demoScenarioData';
import type { ReportIssueScreenProps } from '../types/navigation';

export const ReportIssueScreen: React.FC<ReportIssueScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { simulatedCoords, selectedCorridor, submitIncident } = useDemo();

  const [selectedType, setSelectedType] = useState<Incident['type']>('Landslide');
  const [description, setDescription] = useState<string>(DEMO_INCIDENT_TEMPLATES[0].defaultDescription);
  const [submissionSuccess, setSubmissionSuccess] = useState<Incident | null>(null);

  const selectedTemplate =
    DEMO_INCIDENT_TEMPLATES.find((tItem) => tItem.id === selectedType) ||
    DEMO_INCIDENT_TEMPLATES[0];

  const handleSelectCategory = (type: Incident['type']) => {
    setSelectedType(type);
    const tmpl = DEMO_INCIDENT_TEMPLATES.find((tItem) => tItem.id === type);
    if (tmpl) {
      setDescription(tmpl.defaultDescription);
    }
  };

  // Two-Tap Quick Submission (Moment 5)
  const handleSubmitReport = () => {
    const newInc = submitIncident(selectedType, description, {
      latitude: simulatedCoords[1],
      longitude: simulatedCoords[0],
    });
    setSubmissionSuccess(newInc);
  };

  const handleResetForm = () => {
    setSubmissionSuccess(null);
    setSelectedType('Landslide');
    setDescription(DEMO_INCIDENT_TEMPLATES[0].defaultDescription);
  };

  return (
    <View style={styles.container}>
      <DriverHeader
        title={t('reportIssue', 'Report Issue')}
        subtitle={selectedCorridor.corridorName}
        statusText="2-TAP FIELD REPORT"
        statusType="success"
        showBack={true}
        onBackPress={() => navigation.goBack()}
        onSosPress={() => navigation.navigate('Sos')}
      />

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {submissionSuccess ? (
          /* SUCCESS RECEIPT STATE */
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Text style={styles.successCheck}>✓</Text>
            </View>

            <Text style={styles.successTitle}>Report Submitted Successfully</Text>
            <Text style={styles.successSubtitle}>
              GPS coordinates auto-attached from simulated telemetry. Verified and broadcast to corridor fleet units.
            </Text>

            <View style={styles.receiptBox}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>INCIDENT ID:</Text>
                <Text style={styles.receiptValue}>{submissionSuccess.id}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>CATEGORY:</Text>
                <Text style={styles.receiptValue}>{submissionSuccess.type}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>GPS COORDS:</Text>
                <Text style={styles.receiptValue}>
                  {submissionSuccess.coordinates.latitude.toFixed(4)}° N,{' '}
                  {submissionSuccess.coordinates.longitude.toFixed(4)}° E
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>CORRIDOR:</Text>
                <Text style={styles.receiptValue}>{selectedCorridor.corridorName}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>STATUS:</Text>
                <Text style={styles.receiptStatusTag}>VERIFIED & BROADCAST</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionPrimaryBtn}
              onPress={() => navigation.navigate('WhatsAhead')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionPrimaryBtnText}>View in What's Ahead →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionSecondaryBtn}
              onPress={() => navigation.navigate('Trip')}
              activeOpacity={0.8}
            >
              <Text style={styles.actionSecondaryBtnText}>Return to Live Navigation</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reportAnotherBtn}
              onPress={handleResetForm}
              activeOpacity={0.7}
            >
              <Text style={styles.reportAnotherBtnText}>+ Report Another Hazard</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* TWO-TAP REPORT FORM */
          <View>
            <Text style={styles.sectionHeader}>STEP 1: SELECT HAZARD CATEGORY (TAP TO PICK)</Text>

            <View style={styles.categoryGrid}>
              {DEMO_INCIDENT_TEMPLATES.map((tmpl) => {
                const isSelected = selectedType === tmpl.id;
                return (
                  <TouchableOpacity
                    key={tmpl.id}
                    style={[
                      styles.categoryTile,
                      isSelected && styles.categoryTileSelected,
                    ]}
                    onPress={() => handleSelectCategory(tmpl.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.categoryIcon}>{tmpl.icon}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && styles.categoryLabelSelected,
                      ]}
                    >
                      {tmpl.label}
                    </Text>
                    {isSelected && <Text style={styles.selectedTick}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* GPS TELEMETRY BADGE */}
            <View style={styles.gpsAnchorCard}>
              <View style={styles.gpsIndicatorDot} />
              <View style={styles.gpsTextCol}>
                <Text style={styles.gpsAnchorTitle}>SIMULATED VEHICLE GPS ANCHOR</Text>
                <Text style={styles.gpsAnchorCoords}>
                  {simulatedCoords[1].toFixed(4)}° N, {simulatedCoords[0].toFixed(4)}° E
                </Text>
                <Text style={styles.gpsCorridorName}>{selectedCorridor.corridorName}</Text>
              </View>
            </View>

            {/* QUICK DESCRIPTIONS */}
            <Text style={styles.sectionHeader}>QUICK SITUATION TAGS</Text>
            <View style={styles.chipsRow}>
              {selectedTemplate.quickChips.map((chip, cIdx) => (
                <TouchableOpacity
                  key={cIdx}
                  style={styles.chipPill}
                  onPress={() => setDescription(`${selectedTemplate.defaultDescription} (${chip})`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipPillText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DESCRIPTION INPUT */}
            <View style={styles.descInputBox}>
              <TextInput
                style={styles.descTextInput}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Enter description..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* STEP 2: SUBMIT BUTTON */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmitReport}
              activeOpacity={0.85}
            >
              <Text style={styles.submitBtnText}>
                Step 2: Submit {selectedType} Report ➔
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* BOTTOM NAVIGATION */}
      <DriverBottomNav
        activeTab="report"
        onNavigate={(tab) => {
          if (tab === 'home') navigation.navigate('DriverHome');
          if (tab === 'trip') navigation.navigate('Trip');
          if (tab === 'ahead') navigation.navigate('WhatsAhead');
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.md,
  },
  categoryTile: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.subtle,
  },
  categoryTileSelected: {
    borderColor: colors.brand,
    backgroundColor: '#FEF9C3',
  },
  categoryIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  categoryLabelSelected: {
    color: '#000000',
  },
  selectedTick: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
  },
  gpsAnchorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.subtle,
  },
  gpsIndicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 10,
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsAnchorTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.5,
  },
  gpsAnchorCoords: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  gpsCorridorName: {
    fontSize: 11,
    color: '#94A3B8',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  chipPill: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  chipPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  descInputBox: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 10,
    marginBottom: spacing.lg,
  },
  descTextInput: {
    fontSize: 13,
    color: colors.textPrimary,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: colors.brand,
    paddingVertical: 16,
    borderRadius: radius.pill,
    alignItems: 'center',
    ...shadows.card,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#000000',
  },
  successCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.functionalGreen,
    ...shadows.card,
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successCheck: {
    fontSize: 30,
    fontWeight: '900',
    color: '#15803D',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  receiptBox: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 8,
    marginBottom: spacing.lg,
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
  receiptValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  receiptStatusTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#15803D',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  actionPrimaryBtn: {
    width: '100%',
    backgroundColor: colors.brand,
    paddingVertical: 14,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: 10,
    ...shadows.subtle,
  },
  actionPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000000',
  },
  actionSecondaryBtn: {
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  reportAnotherBtn: {
    paddingVertical: 8,
  },
  reportAnotherBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
});
