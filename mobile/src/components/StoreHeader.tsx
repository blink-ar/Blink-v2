import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import { Business } from '../types';
import { colors, borderRadius } from '../constants/theme';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

interface StoreHeaderProps {
  business: Business;
  onBack: () => void;
}

const StoreHeader: React.FC<StoreHeaderProps> = ({ business, onBack }) => {
  const insets = useSafeAreaInsets();
  const categoryColor = CATEGORY_COLORS[business.category] || '#10B981';
  const categoryIcon = CATEGORY_ICONS[business.category] || '🛒';

  const locationText = business.location?.[0]?.formattedAddress
    ? business.location[0].formattedAddress.split(',')[0]
    : 'Ubicación no disponible';

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <ArrowLeft size={24} color={colors.gray[800]} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={[styles.iconBox, { backgroundColor: categoryColor }]}>
          <Text style={styles.iconText}>{categoryIcon}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
          <View style={styles.locationRow}>
            <MapPin size={12} color={colors.gray[400]} />
            <Text style={styles.location} numberOfLines={1}>{locationText}</Text>
          </View>
          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{business.category}</Text>
            </View>
            <Text style={styles.benefitCount}>
              {business.benefits.length} beneficio{business.benefits.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
  backButton: {
    marginBottom: 12,
    width: 40,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  location: {
    fontSize: 12,
    color: colors.gray[500],
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  categoryText: {
    fontSize: 11,
    color: colors.gray[600],
    fontWeight: '500',
  },
  benefitCount: {
    fontSize: 12,
    color: colors.gray[500],
  },
});

export default StoreHeader;
