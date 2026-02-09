import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Business } from '../types';
import BusinessCard from './cards/BusinessCard';
import { colors } from '../constants/theme';

interface ActiveOffersProps {
  businesses: Business[];
  onBusinessClick: (businessId: string) => void;
  onViewAll: () => void;
  title?: string;
}

const ActiveOffers: React.FC<ActiveOffersProps> = React.memo(({
  businesses,
  onBusinessClick,
  onViewAll,
  title = 'Ofertas Activas',
}) => {
  if (businesses.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={styles.viewAll}>Ver más</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {businesses.slice(0, 5).map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onClick={onBusinessClick}
            horizontal
          />
        ))}
      </ScrollView>
    </View>
  );
});

ActiveOffers.displayName = 'ActiveOffers';

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray[900],
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.blue[500],
  },
  scrollContent: {
    paddingLeft: 16,
    paddingRight: 8,
  },
});

export default ActiveOffers;
