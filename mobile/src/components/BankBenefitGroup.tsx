import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { BankBenefit } from '../types';
import BenefitCard from './cards/BenefitCard';
import { colors, borderRadius, shadows } from '../constants/theme';

interface BankBenefitGroupProps {
  bankName: string;
  benefits: BankBenefit[];
  defaultExpanded?: boolean;
  onBenefitSelect: (benefit: BankBenefit) => void;
}

export const BankBenefitGroup: React.FC<BankBenefitGroupProps> = ({
  bankName,
  benefits,
  defaultExpanded = true,
  onBenefitSelect,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={[styles.container, shadows.sm]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Text style={styles.bankIcon}>🏦</Text>
          <View>
            <Text style={styles.bankName}>{bankName}</Text>
            <Text style={styles.benefitCount}>
              {benefits.length} beneficio{benefits.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        {expanded ? (
          <ChevronUp size={20} color={colors.gray[400]} />
        ) : (
          <ChevronDown size={20} color={colors.gray[400]} />
        )}
      </TouchableOpacity>

      {expanded && (
        <View style={styles.benefitsList}>
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={`${bankName}-${index}`}
              benefit={benefit}
              onSelect={() => onBenefitSelect(benefit)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.gray[50],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bankIcon: {
    fontSize: 22,
  },
  bankName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray[900],
  },
  benefitCount: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 1,
  },
  benefitsList: {
    padding: 10,
    gap: 8,
  },
});
