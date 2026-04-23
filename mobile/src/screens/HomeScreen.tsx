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
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin } from 'lucide-react-native';
import type { HomeStackParamList } from '../types/navigation';
import type { Business } from '../types';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { Ticker } from '../components/ui/Ticker';
import { CategoryMarquee } from '../components/ui/CategoryMarquee';
import { CATEGORY_MAP } from '../constants';

type Nav = NativeStackNavigationProp<HomeStackParamList>;

function getMaxDiscount(business: Business): number {
  let max = 0;
  for (const b of business.benefits) {
    const m = b.rewardRate.match(/(\d+)%/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return max;
}

function BentoCard({ business, onPress }: { business: Business & { maxDiscount: number }; onPress: () => void }) {
  const cat = CATEGORY_MAP[business.category] || { bg: '#F3F4F6', text: '#374151', emoji: '\u2728' };
  const topBenefit = business.benefits.find((b) => {
    const m = b.rewardRate.match(/(\d+)%/);
    return m && parseInt(m[1]) === business.maxDiscount;
  }) || business.benefits[0];

  return (
    <TouchableOpacity style={styles.bento} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.bentoHeader, { backgroundColor: cat.bg }]}>
        <Text style={styles.bentoEmoji}>{cat.emoji}</Text>
        <View style={styles.bentoBadge}>
          <Text style={styles.bentoBadgeText}>{topBenefit?.bankName?.split(' ')[0] || 'BANCO'}</Text>
        </View>
      </View>
      <View style={styles.bentoBody}>
        <Text style={styles.bentoName} numberOfLines={1}>{business.name}</Text>
        <Text style={[styles.bentoDiscount, { color: cat.text }]}>{business.maxDiscount}% OFF</Text>
        <Text style={styles.bentoBenefitCount}>
          {business.benefits.length} beneficio{business.benefits.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={styles.seeAll}>Ver todos</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { businesses, isLoading, refreshData } = useBenefitsData();
  const enriched = useEnrichedBusinesses(businesses);

  const top5 = useMemo(() => {
    const seen = new Set<string>();
    return enriched
      .map((b) => ({ ...b, maxDiscount: getMaxDiscount(b) }))
      .filter((b) => {
        if (b.maxDiscount === 0) return false;
        if (seen.has(b.name)) return false;
        seen.add(b.name);
        return true;
      })
      .sort((a, b) => b.maxDiscount - a.maxDiscount)
      .slice(0, 5);
  }, [enriched]);

  const goToBusiness = (businessId: string, business: Business) =>
    navigation.navigate('BusinessDetail', { businessId, business });

  const goToSearch = (category?: string) =>
    (navigation as any).getParent()?.navigate('SearchTab', { category });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F6F4" />
      <SafeAreaView edges={["top"]} style={styles.safeTop}>
        <Ticker />
      </SafeAreaView>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshData} tintColor="#6366F1" />
        }
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Descubrí beneficios</Text>
          <Text style={styles.heroTitle}>Los mejores descuentos{'\n'}cerca tuyo</Text>
          <Text style={styles.heroSub}>
            Encontrá todos los beneficios de tus tarjetas en un solo lugar.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.heroCTA}
              onPress={() => (navigation as any).getParent()?.navigate('SearchTab')}
              activeOpacity={0.85}
            >
              <Search size={16} color="#fff" />
              <Text style={styles.heroCTAText}>Buscar beneficios</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.heroMapBtn}
              onPress={() => (navigation as any).getParent()?.navigate('MapTab')}
              activeOpacity={0.85}
            >
              <MapPin size={16} color="#6366F1" />
              <Text style={styles.heroMapText}>Ver mapa</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top 5 */}
        {top5.length > 0 && (
          <View>
            <SectionHeader title="Top descuentos" onSeeAll={() => goToSearch()} />
            <FlatList
              data={top5}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bentoList}
              renderItem={({ item }) => (
                <BentoCard
                  business={item}
                  onPress={() => goToBusiness(item.id, item)}
                />
              )}
            />
          </View>
        )}

        {/* Categories */}
        <View>
          <SectionHeader title="Explorar categorías" />
          <CategoryMarquee onCategoryPress={goToSearch} />
        </View>

        {/* Loading placeholder */}
        {isLoading && businesses.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        )}

        {/* Newsletter CTA */}
        <View style={styles.newsletter}>
          <Text style={styles.newsletterTitle}>¿Tenés una tarjeta?</Text>
          <Text style={styles.newsletterSub}>
            Buscá beneficios por banco y encontrá los descuentos que más te convienen.
          </Text>
          <TouchableOpacity
            style={styles.newsletterBtn}
            onPress={() => (navigation as any).getParent()?.navigate('SearchTab')}
          >
            <Text style={styles.newsletterBtnText}>Explorar beneficios →</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  safeTop: { backgroundColor: '#F7F6F4' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 24,
  },
  heroEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1C1C1E',
    lineHeight: 36,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCTA: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroCTAText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  heroMapBtn: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMapText: {
    color: '#6366F1',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  seeAll: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  bentoList: {
    paddingHorizontal: 20,
    gap: 12,
  },
  bento: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bentoHeader: {
    height: 80,
    padding: 12,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bentoEmoji: { fontSize: 28 },
  bentoBadge: {
    backgroundColor: 'rgba(0,0,0,0.12)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bentoBadgeText: { fontSize: 9, fontWeight: '700', color: '#1C1C1E' },
  bentoBody: { padding: 12 },
  bentoName: { fontSize: 13, fontWeight: '700', color: '#1C1C1E', marginBottom: 4 },
  bentoDiscount: { fontSize: 20, fontWeight: '800', marginBottom: 2 },
  bentoBenefitCount: { fontSize: 11, color: '#9CA3AF' },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  newsletter: {
    margin: 20,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 20,
  },
  newsletterTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  newsletterSub: { fontSize: 13, color: '#6B7280', lineHeight: 19, marginBottom: 14 },
  newsletterBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  newsletterBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
