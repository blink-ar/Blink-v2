import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
  StatusBar,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeStackParamList } from '../types/navigation';
import type { Business } from '../types';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { Ticker } from '../components/ui/Ticker';
import { CategoryMarquee } from '../components/ui/CategoryMarquee';
import { buildBankOptions } from '../utils/banks';
import { fetchBanks, fetchMongoStats } from '../services/api';
import { formatDistance } from '../utils/distance';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function getMaxDiscount(b: Business): number {
  let max = 0;
  for (const ben of b.benefits) {
    const m = ben.rewardRate.match(/(\d+)%/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return max;
}

function TopBenefitCard({
  item,
  idx,
  onPress,
}: {
  item: { business: Business; benefit: Business['benefits'][number]; benefitIndex: number; discount: number };
  idx: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      {/* Card image header */}
      <View style={styles.cardHeader}>
        {item.business.image ? (
          <Image source={{ uri: item.business.image }} style={styles.cardImg} resizeMode="cover" />
        ) : (
          <View style={styles.cardImgPlaceholder} />
        )}
        {/* Dark scrim */}
        <View style={styles.cardScrim} />
        {/* Discount badge */}
        <View style={styles.discountBadge}>
          <Text style={styles.discountNum}>{item.discount}%</Text>
          <Text style={styles.discountOff}>OFF</Text>
        </View>
        {/* Rank badge */}
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{idx + 1}</Text>
        </View>
      </View>
      {/* Card body */}
      <View style={styles.cardBody}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>{item.business.name}</Text>
          {item.business.distanceText && (
            <>
              <Text style={styles.cardDot}>·</Text>
              <Text style={styles.cardDistance}>{item.business.distanceText}</Text>
            </>
          )}
        </View>
        <Text style={styles.cardBank} numberOfLines={1}>
          {item.benefit.bankName} · {item.benefit.cardName}
        </Text>
        <View style={styles.cardFooter}>
          <Text style={styles.cardCuando}>
            {item.benefit.cuando ? String(item.benefit.cuando).substring(0, 20) : 'Disponible hoy'}
          </Text>
          <Text style={{ fontSize: 16 }}>🔖</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { businesses, isLoading, refreshData } = useBenefitsData({});

  const { data: statsResponse } = useQuery({
    queryKey: ['home-ticker-stats'],
    queryFn: fetchMongoStats,
    staleTime: 5 * 60 * 1000,
  });
  const { data: availableBankNames = [] } = useQuery({
    queryKey: ['availableBanks'],
    queryFn: fetchBanks,
    staleTime: 30 * 60 * 1000,
  });

  const activeBenefitsCount = statsResponse?.stats?.totalBenefits || 0;
  const enriched = useEnrichedBusinesses(businesses);

  const top5 = useMemo(() => {
    const all: { business: Business; benefit: Business['benefits'][number]; benefitIndex: number; discount: number }[] = [];
    businesses.forEach((business) => {
      business.benefits.forEach((b, bIdx) => {
        const m = String(b.rewardRate).match(/(\d+)%/);
        if (m) all.push({ business, benefit: b, benefitIndex: bIdx, discount: parseInt(m[1]) });
      });
    });
    const sorted = all.sort((a, b) => b.discount - a.discount);
    const selected: typeof all = [];
    const seen = new Set<string>();
    for (const item of sorted) {
      const key = (item.business.id || item.business.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      selected.push(item);
      seen.add(key);
      if (selected.length === 5) break;
    }
    return selected;
  }, [businesses]);

  const businessBankNames = useMemo(() => {
    const names: string[] = [];
    businesses.forEach((b) => b.benefits.forEach((ben) => { if (ben.bankName) names.push(ben.bankName); }));
    return names;
  }, [businesses]);

  const indexedEntities = useMemo(
    () => buildBankOptions(availableBankNames, businessBankNames),
    [availableBankNames, businessBankNames],
  );

  const goToSearch = (params?: { bank?: string; category?: string }) =>
    (navigation as any).getParent()?.navigate('SearchTab', params);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView edges={['top']} style={styles.header}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>Blink</Text>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={{ fontSize: 20 }}>🔔</Text>
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 14 }}>👤</Text>
            </View>
          </View>
        </View>
        <Ticker count={activeBenefitsCount} />
      </SafeAreaView>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor="#6366F1" />}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Todos tus descuentos{'\n'}
            <Text style={styles.heroGradientText}>en un solo lugar</Text>
          </Text>
          <Text style={styles.heroSub}>Bancos · Billeteras · Clubes · Suscripciones</Text>

          {/* CTA */}
          <TouchableOpacity style={styles.cta} onPress={() => goToSearch()} activeOpacity={0.88}>
            <Text style={styles.ctaText}>Buscá beneficios</Text>
            <View style={styles.ctaArrow}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Entity pills */}
          {indexedEntities.length > 0 && (
            <View style={styles.entityCard}>
              <Text style={styles.entityTitle}>Estamos en Beta! Estos son los emisores disponibles hoy en Blink.</Text>
              <View style={styles.entityPills}>
                {indexedEntities.map((entity) => (
                  <TouchableOpacity
                    key={entity.token}
                    style={styles.entityPill}
                    onPress={() => goToSearch({ bank: entity.token })}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.entityPillText}>{entity.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Top 5 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Top 5 hoy</Text>
              <Text style={{ fontSize: 16 }}>🔥</Text>
            </View>
            <TouchableOpacity onPress={() => goToSearch()}>
              <Text style={styles.seeAll}>Ver todo →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={isLoading ? (Array(3).fill(null) as null[]) : top5}
            keyExtractor={(item, i) => item ? `${item.business.id}-${i}` : `sk-${i}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardList}
            renderItem={({ item, index }) =>
              item ? (
                <TopBenefitCard
                  item={item}
                  idx={index}
                  onPress={() =>
                    navigation.navigate('BenefitDetail', {
                      businessId: item.business.id,
                      benefitIndex: item.benefitIndex,
                      business: item.business,
                    })
                  }
                />
              ) : (
                <View style={styles.skeleton} />
              )
            }
          />
        </View>

        {/* Category Marquee */}
        <CategoryMarquee onCategoryPress={(cat) => goToSearch({ category: cat })} />

        {/* Newsletter CTA */}
        <View style={styles.newsletter}>
          <View style={styles.newsletterCircle1} />
          <View style={styles.newsletterCircle2} />
          <Text style={styles.newsletterTitle}>¿Querés más?</Text>
          <Text style={styles.newsletterSub}>Recibí las mejores ofertas antes que nadie.</Text>
          <View style={styles.newsletterRow}>
            <TextInput
              style={styles.newsletterInput}
              placeholder="tu@email.com"
              placeholderTextColor="rgba(255,255,255,0.6)"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TouchableOpacity style={styles.newsletterBtn}>
              <Text style={styles.newsletterBtnText}>Suscribirse</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  header: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,230,225,0.8)',
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brand: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', letterSpacing: -0.5 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  hero: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 },
  heroTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 8,
  },
  heroGradientText: { color: '#6366F1' },
  heroSub: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  cta: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 16,
  },
  ctaText: { fontSize: 15, fontWeight: '600', color: '#fff', letterSpacing: -0.3 },
  ctaArrow: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  entityCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: 'rgba(238,242,255,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.18)',
  },
  entityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  entityPills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  entityPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E8E6E1',
  },
  entityPillText: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  seeAll: { fontSize: 12, fontWeight: '600', color: '#6366F1' },
  cardList: { paddingHorizontal: 16, gap: 12 },
  card: {
    width: 220,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    height: 112,
    backgroundColor: '#6366F1',
    position: 'relative',
  },
  cardImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  cardImgPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#4F46E5' },
  cardScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    // gradient scrim via overlay — approximate with semi-transparent black
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  discountNum: { fontSize: 22, fontWeight: '700', color: '#fff', lineHeight: 26 },
  discountOff: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)', marginBottom: 2 },
  rankBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  rankText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  cardBody: { padding: 12, backgroundColor: '#fff' },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  cardName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', flex: 1 },
  cardDot: { fontSize: 11, color: '#9CA3AF', marginHorizontal: 3 },
  cardDistance: { fontSize: 11, color: '#9CA3AF', flexShrink: 0 },
  cardBank: { fontSize: 11, color: '#9CA3AF', marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardCuando: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },
  skeleton: {
    width: 220,
    height: 192,
    borderRadius: 16,
    backgroundColor: '#D1D5DB',
  },
  newsletter: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#6366F1',
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    marginTop: 24,
  },
  newsletterCircle1: {
    position: 'absolute',
    top: -24,
    right: -24,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  newsletterCircle2: {
    position: 'absolute',
    bottom: -32,
    left: -16,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  newsletterTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  newsletterSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  newsletterRow: { flexDirection: 'row', gap: 8 },
  newsletterInput: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  newsletterBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  newsletterBtnText: { fontSize: 13, fontWeight: '600', color: '#6366F1' },
});
