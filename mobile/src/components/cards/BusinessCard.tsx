import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { Business } from '../../types';
import { colors, shadows, borderRadius } from '../../constants/theme';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../../constants';

interface BusinessCardProps {
  business: Business;
  onClick: (businessId: string) => void;
  compact?: boolean;
  horizontal?: boolean;
}

const BusinessCard: React.FC<BusinessCardProps> = React.memo(({
  business,
  onClick,
  compact = false,
  horizontal = false,
}) => {
  const getDiscountPercentage = (): string => {
    const benefits = business.benefits || [];
    const discounts = benefits
      .map((benefit) => {
        const match = (benefit?.rewardRate || '').match(/(\d+)%/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((d) => d > 0);

    if (discounts.length > 0) {
      return `hasta ${Math.max(...discounts)}% OFF`;
    }
    return 'hasta 15% OFF';
  };

  const getBenefitCount = (): string => `+${(business.benefits || []).length}`;

  const getLocationText = (): string => {
    if (!business.location || business.location.length === 0) return 'Ubicación no disponible';
    const loc = business.location[0];
    if (loc.formattedAddress && loc.formattedAddress !== 'Location not available') {
      const parts = loc.formattedAddress.split(',');
      return parts[0].trim();
    }
    if (loc.addressComponents?.neighborhood) return loc.addressComponents.neighborhood;
    if (loc.name) return loc.name;
    return 'Ubicación';
  };

  const categoryColor = CATEGORY_COLORS[business.category] || '#10B981';
  const categoryIcon = CATEGORY_ICONS[business.category] || '🛒';

  if (horizontal) {
    return (
      <TouchableOpacity
        style={[styles.horizontalCard, shadows.sm]}
        onPress={() => onClick(business.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.iconBox, { backgroundColor: categoryColor }]}>
          <Text style={styles.iconText}>{categoryIcon}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{getBenefitCount()}</Text>
          </View>
        </View>
        <View style={styles.horizontalContent}>
          <Text style={styles.businessName} numberOfLines={1}>{business.name || 'Sin nombre'}</Text>
          <View style={styles.locationRow}>
            <MapPin size={11} color={colors.gray[400]} />
            <Text style={styles.locationText} numberOfLines={1}>{business.distanceText || getLocationText()}</Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{getDiscountPercentage()}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, shadows.sm]}
      onPress={() => onClick(business.id)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <View style={styles.iconBoxContainer}>
          <View style={[styles.iconBox, { backgroundColor: categoryColor }]}>
            <Text style={styles.iconText}>{categoryIcon}</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{getBenefitCount()}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.nameRow}>
            <Text style={styles.businessName} numberOfLines={1}>
              {business.name || 'Sin nombre'}
              <Text style={styles.categoryLabel}> • {business.category || 'otros'}</Text>
            </Text>
          </View>
          <View style={styles.locationRow}>
            <MapPin size={11} color={colors.gray[400]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {business.distanceText || getLocationText()}
            </Text>
            {business.hasOnline && (
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>🌐 Online</Text>
              </View>
            )}
          </View>
          <View style={styles.bottomRow}>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{getDiscountPercentage()}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

BusinessCard.displayName = 'BusinessCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[100],
  },
  horizontalCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: 12,
    width: 280,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.gray[100],
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBoxContainer: {
    position: 'relative',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.gray[700],
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  countText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  horizontalContent: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  businessName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gray[900],
    flexShrink: 1,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: colors.gray[500],
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  locationText: {
    fontSize: 11,
    color: colors.gray[500],
    flex: 1,
  },
  onlineBadge: {
    backgroundColor: colors.blue[100],
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  onlineText: {
    fontSize: 10,
    color: colors.blue[700],
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discountBadge: {
    backgroundColor: colors.green[100],
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.green[700],
  },
});

export default BusinessCard;
