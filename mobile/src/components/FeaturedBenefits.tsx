import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { RawMongoBenefit } from '../types/mongodb';
import { colors, shadows, borderRadius } from '../constants/theme';

interface FeaturedBenefitsProps {
  benefits: RawMongoBenefit[];
  onBenefitSelect?: (benefit: RawMongoBenefit) => void;
}

const FeaturedBenefits: React.FC<FeaturedBenefitsProps> = ({
  benefits,
  onBenefitSelect,
}) => {
  const featuredBenefit = benefits[0];
  if (!featuredBenefit?.merchant) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.banner, shadows.md]}
        onPress={() => onBenefitSelect?.(featuredBenefit)}
        activeOpacity={0.85}
      >
        <View style={styles.bannerContent}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {featuredBenefit.discountPercentage > 0
                ? `${featuredBenefit.discountPercentage}% OFF`
                : 'Oferta'}
            </Text>
          </View>
          <Text style={styles.merchantName} numberOfLines={1}>
            {featuredBenefit.merchant?.name || 'Comercio'}
          </Text>
          <Text style={styles.benefitTitle} numberOfLines={2}>
            {featuredBenefit.benefitTitle || 'Beneficio disponible'}
          </Text>
          <Text style={styles.bankName}>
            {featuredBenefit.bank || ''}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: colors.white,
  },
  banner: {
    borderRadius: borderRadius['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.primary[600],
  },
  bannerContent: {
    padding: 24,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  discountText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  merchantName: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  benefitTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    marginBottom: 8,
  },
  bankName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default FeaturedBenefits;
