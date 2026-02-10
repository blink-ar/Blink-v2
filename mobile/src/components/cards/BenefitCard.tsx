import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { BankBenefit } from '../../types';
import { GradientBadge } from '../ui/GradientBadge';
import { colors, shadows, borderRadius } from '../../constants/theme';

interface BenefitCardProps {
  benefit: BankBenefit;
  onSelect: () => void;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ benefit, onSelect }) => {
  const getDiscountPercentage = (rewardRate: string) => {
    const match = rewardRate.match(/(\d+)%/);
    return match ? match[1] : rewardRate;
  };

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <GradientBadge
          percentage={getDiscountPercentage(benefit.rewardRate)}
          installments={benefit.installments}
          benefitTitle={benefit.benefit}
          size="md"
        />
        <Text style={styles.cardName} numberOfLines={1}>{benefit.cardName}</Text>
      </View>

      <Text style={styles.benefitText} numberOfLines={2}>
        {benefit.benefit}
      </Text>

      {benefit.cuando && (
        <Text style={styles.whenText} numberOfLines={1}>
          {benefit.cuando}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardName: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.gray[600],
    maxWidth: '40%',
  },
  benefitText: {
    fontSize: 13,
    color: colors.gray[800],
    lineHeight: 18,
    marginBottom: 6,
  },
  whenText: {
    fontSize: 11,
    color: colors.gray[400],
  },
});

export default BenefitCard;
