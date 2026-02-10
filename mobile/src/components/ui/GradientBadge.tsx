import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GradientBadgeProps {
  percentage: string;
  installments?: number | null;
  benefitTitle?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GradientBadge: React.FC<GradientBadgeProps> = ({
  percentage,
  installments,
  benefitTitle,
  size = 'md',
}) => {
  const isInstallments = installments != null && installments > 0;
  const isPercentage = percentage && percentage !== '0' && percentage !== 'null';

  let displayText = '';
  let bgColor = '#10B981';

  if (isInstallments) {
    displayText = `${installments} cuotas`;
    bgColor = '#6366F1';
  } else if (isPercentage) {
    displayText = `${percentage}%`;
    bgColor = '#10B981';
  } else if (benefitTitle) {
    displayText = benefitTitle.length > 20 ? benefitTitle.substring(0, 20) + '...' : benefitTitle;
    bgColor = '#3B82F6';
  }

  if (!displayText) return null;

  const sizeStyles = {
    sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10 },
    md: { paddingHorizontal: 8, paddingVertical: 4, fontSize: 12 },
    lg: { paddingHorizontal: 10, paddingVertical: 6, fontSize: 14 },
  };

  return (
    <View style={[styles.badge, { backgroundColor: bgColor, ...sizeStyles[size] }]}>
      <Text style={[styles.text, { fontSize: sizeStyles[size].fontSize }]}>
        {displayText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
