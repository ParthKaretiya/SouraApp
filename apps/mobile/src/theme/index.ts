/**
 * SauraRoute Driver System — Light Commercial Product Design System
 * 
 * Blinkit-inspired product simplicity + Driver navigation functionality:
 * - Light canvas (#F5F7F8) and pure white surfaces (#FFFFFF)
 * - Brand Saura Yellow (#F8CB46 / #E5B82C) for high-emphasis CTAs and active states
 * - Functional Green (#0C831F / #10B981) for safety, positive metrics, and confirmations
 * - High-contrast text (#171717, #4B5563, #6B7280) with natural capitalization
 * - Clean 4/8-based spacing, restrained radii, and subtle elevations (no heavy dark borders)
 */

export const colors = {
  // Brand Saura Palette
  brand: '#F8CB46',
  brandDark: '#E5B82C',
  brandLight: '#FEF3C7',
  brandBg: 'rgba(248, 203, 70, 0.14)',

  // Light Canvas & Clean Surfaces
  background: '#F5F7F8',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F4F5',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#EAEEF0',

  // Subtle Dividers & Outlines (Hairline, no harsh dark borders)
  border: '#E5E7EB',
  borderSubtle: '#F0F2F4',
  borderLight: '#E2E8F0',
  borderHighlight: 'rgba(248, 203, 70, 0.5)',

  // Modern High-Contrast Typography
  textPrimary: '#171717',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',
  textDark: '#111111',
  textWhite: '#FFFFFF',

  // Functional Green Palette
  functionalGreen: '#0C831F',
  functionalGreenLight: '#E8F5E9',
  success: '#10B981',
  successLight: '#34D399',
  successBg: '#E8F5E9',
  successDark: '#0C831F',

  // Warning Amber Palette
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningBg: '#FEF3C7',
  warningText: '#B45309',

  // Emergency Danger Palette
  danger: '#EF4444',
  dangerLight: '#F87171',
  dangerBg: '#FEE2E2',
  dangerText: '#B91C1C',

  // Information & Navigation Accents
  accent: '#0284C7',
  accentBg: '#E0F2FE',
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  // Floating & Map Specific Overlays
  cardOverlay: 'rgba(255, 255, 255, 0.95)',
  floatingOverlay: 'rgba(255, 255, 255, 0.98)',
  floatingOverlayDark: 'rgba(15, 23, 42, 0.95)',
  mapDarkBg: '#0F172A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  hero: 32,
};

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  card: 16,
  lg: 20,
  pill: 9999,
};

export const typography = {
  display: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 34,
  },
  hero: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 38,
  },
  title1: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 30,
  },
  title2: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    lineHeight: 21,
  },
  bodyLarge: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textMuted,
    lineHeight: 16,
  },
  metricLarge: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 38,
  },
  metric: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  cta: {
    fontSize: 15,
    fontWeight: '700' as const,
    lineHeight: 20,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
  },
};

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const layout = {
  minTouchTarget: 48,
  minTouchTargetLg: 52,
  borderRadiusSm: radius.sm,
  borderRadiusMd: radius.md,
  borderRadiusLg: radius.card,
  borderRadiusRound: radius.pill,
};
