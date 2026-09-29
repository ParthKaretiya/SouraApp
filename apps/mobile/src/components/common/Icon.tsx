import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

export type IconName =
  | 'home'
  | 'trip'
  | 'ahead'
  | 'report'
  | 'sos'
  | 'location'
  | 'chevronRight'
  | 'check'
  | 'alert'
  | 'refresh'
  | 'weather'
  | 'truck'
  | 'flag'
  | 'search'
  | 'cross';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({ name, size = 20, color = colors.textPrimary }) => {
  switch (name) {
    case 'home':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.9, color, lineHeight: size }}>⌂</Text>
        </View>
      );
    case 'trip':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size, transform: [{ rotate: '45deg' }] }}>▲</Text>
        </View>
      );
    case 'ahead':
    case 'alert':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.9, color, lineHeight: size }}>⚠</Text>
        </View>
      );
    case 'report':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⚑</Text>
        </View>
      );
    case 'sos':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size, fontWeight: '900' }}>✚</Text>
        </View>
      );
    case 'location':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>◉</Text>
        </View>
      );
    case 'chevronRight':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size, color, lineHeight: size, fontWeight: '700' }}>›</Text>
        </View>
      );
    case 'check':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size, fontWeight: '900' }}>✓</Text>
        </View>
      );
    case 'refresh':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.9, color, lineHeight: size }}>↻</Text>
        </View>
      );
    case 'weather':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>☁</Text>
        </View>
      );
    case 'truck':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>⛟</Text>
        </View>
      );
    case 'search':
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.95, color, lineHeight: size, fontWeight: '700' }}>⌕</Text>
        </View>
      );
    default:
      return (
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={{ fontSize: size * 0.8, color, lineHeight: size }}>●</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
