import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, radius, shadows } from '../theme';
import type { SupportedLanguage } from '../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = (i18n.language || 'en') as SupportedLanguage;

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिं' },
    { code: 'as', label: 'অস' },
  ];

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View style={styles.container}>
      {languages.map((l) => {
        const isActive = currentLang === l.code;
        return (
          <TouchableOpacity
            key={l.code}
            style={[styles.langButton, isActive && styles.langButtonActive]}
            onPress={() => handleSelectLanguage(l.code)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Switch language to ${l.label}`}
          >
            <Text style={[styles.langText, isActive && styles.langTextActive]}>
              {l.label}
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
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  langButton: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: radius.sm,
    minWidth: 36,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langButtonActive: {
    backgroundColor: colors.brand,
    ...shadows.subtle,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  langTextActive: {
    color: colors.textDark,
    fontWeight: '900',
  },
});
