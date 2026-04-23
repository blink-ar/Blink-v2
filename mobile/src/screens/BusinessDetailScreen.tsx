import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MapPin, Star, Heart, ExternalLink } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import type { HomeStackParamList } from '../types/navigation';
import type { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { useSavedBenefits } from '../hooks/useSavedBenefits';
import { CATEGORY_MAP } from '../constants';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'BusinessDetail'>;

function getMaxDiscount(b: BankBenefit): number {
  const m = b.rewardRate.match(/(\d+)%/);
  return m ? parseInt(m[1]) : 0;
}

function BenefitCard({ benefit, onPress, isFeatured }: { benefit: BankBenefit; onPress: () => void; isFeatured?: boolean }) {
  const discount = getMaxDiscount(benefit);
  return (
    <TouchableOpacity
      style={[styles.benefitCard, isFeatured && styles.benefitCardFeatured]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {isFeatured ? (
        <View style={styles.featuredContent}>
          <View>
            <Text style={styles.featuredBank}>{benefit.bankName}</Text>
            <Text style={styles.featuredBenefit} numberOfLines={2}>{benefit.benefit}</Text>
          </View>
          {discount > 0 && (
            <Text style={styles.featuredDiscount}>{discount}%</Text>
          )}
        </View>
      ) : (
        <View style={styles.compactContent}>
          <View style={styles.compactLeft}>
            <Text style={styles.compactBank}>{benefit.bankName}</Text>
            <Text style={styles.compactBenefit} numberOfLines={2}>{benefit.benefit}</Text>
          </View>
          {discount > 0 && (
            <Text style={styles.compactDiscount}>{discount}%</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function BusinessDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { businessId, business: passedBusiness } = route.params;

  const { data: fetchedBusiness, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusinessById(businessId),
    enabled: !passedBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const business: Business | null = passedBusiness || fetchedBusiness || null;
  const { isSaved, toggleBenefit } = useSavedBenefits();

  const cat = business ? CATEGORY_MAP[business.category] || { bg: '#EEF2FF', text: '#6366F1', emoji: '✨' } : null;

  const [topBenefits, restBenefits] = useMemo(() => {
    if (!business) return [[], []];
    const sorted = [...business.benefits].sort((a, b) => getMaxDiscount(b) - getMaxDiscount(a));
    return [sorted.slice(0, 2), sorted.slice(2)];
  }, [business]);

  const goToBenefit = (benefitIndex: number) => {
    if (!business) return;
    const realIndex = business.benefits.indexOf(
      [...business.benefits].sort((a, b) => getMaxDiscount(b) - getMaxDiscount(a))[benefitIndex] || business.benefits[0]
    );
    navigation.navigate('BenefitDetail', {
      businessId,
      benefitIndex: realIndex >= 0 ? realIndex : benefitIndex,
      business,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#6366F1' />
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No se pudo cargar el comercio.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const hasLocation = business.location && business.location.length > 0;
  const address = hasLocation
    ? business.location[0].formattedAddress || business.location[0].name || 'Ver en mapa'
    : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle='dark-content' />
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: cat?.bg || '#EEF2FF' }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <ChevronLeft size={22} color={cat?.text || '#6366F1'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => business.benefits.length > 0 && toggleBenefit(business, 0)}
              style={styles.heartBtn}
            >
              <Heart
                size={20}
                color={cat?.text || '#6366F1'}
                fill={isSaved(businessId, 0) ? (cat?.text || '#6366F1') : 'none'}
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <Text style={styles.heroEmoji}>{cat?.emoji || '✨'}</Text>
          <Text style={styles.heroName}>{business.name}</Text>
          <View style={styles.heroBadges}>
            <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
              <Text style={[styles.heroBadgeText, { color: cat?.text || '#6366F1' }]}>
                {business.category}
              </Text>
            </View>
            {business.rating > 0 && (
              <View style={[styles.heroBadge, { backgroundColor: 'rgba(0,0,0,0.08)' }]}>
                <Star size={11} color='#F59E0B' fill='#F59E0B' />
                <Text style={[styles.heroBadgeText, { color: cat?.text || '#6366F1' }]}>
                  {business.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Featured benefits */}
        {topBenefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis beneficios</Text>
            {topBenefits.map((benefit, i) => (
              <BenefitCard
                key={i}
                benefit={benefit}
                onPress={() => goToBenefit(i)}
                isFeatured
              />
            ))}
          </View>
        )}

        {/* More benefits */}
        {restBenefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Más beneficios</Text>
            {restBenefits.map((benefit, i) => (
              <BenefitCard
                key={i}
                benefit={benefit}
                onPress={() => goToBenefit(topBenefits.length + i)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() =>
            (navigation as any).getParent()?.navigate('MapTab', { business: businessId })
          }
          activeOpacity={0.85}
        >
          <MapPin size={16} color='#fff' />
          <Text style={styles.mapBtnText}>
            {address ? address : 'Ver en mapa'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#6B7280' },
  hero: { paddingBottom: 24 },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  backBtn: { padding: 8 },
  heartBtn: { padding: 8 },
  heroContent: { paddingHorizontal: 20, paddingTop: 8 },
  heroEmoji: { fontSize: 40, marginBottom: 8 },
  heroName: { fontSize: 26, fontWeight: '800', color: '#1C1C1E', marginBottom: 10 },
  heroBadges: { flexDirection: 'row', gap: 8 },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  benefitCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  benefitCardFeatured: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  featuredContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  featuredBank: { fontSize: 11, fontWeight: '700', color: '#6366F1', marginBottom: 4, textTransform: 'uppercase' },
  featuredBenefit: { fontSize: 14, fontWeight: '600', color: '#1C1C1E', flex: 1, paddingRight: 12 },
  featuredDiscount: { fontSize: 28, fontWeight: '900', color: '#6366F1' },
  compactContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLeft: { flex: 1, paddingRight: 8 },
  compactBank: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 2 },
  compactBenefit: { fontSize: 13, color: '#374151', fontWeight: '500' },
  compactDiscount: { fontSize: 18, fontWeight: '800', color: '#6366F1' },
  bottomBar: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
  },
  mapBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
