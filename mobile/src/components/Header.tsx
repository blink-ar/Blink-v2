import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/theme';

export const Header: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.title}>Blink</Text>
      <Text style={styles.subtitle}>Beneficios</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary[600],
  },
  subtitle: {
    fontSize: 13,
    color: colors.gray[500],
    marginTop: -2,
  },
});
