import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X, MapPin, ChevronRight } from 'lucide-react-native';
import type { SearchStackParamList } from '../types/navigation';
import type { Business } from '../types';
import { useBenefitsData, BenefitsFilters } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { buildBankOptions, toBankDescriptor } from '../utils/banks';
import { UnifiedFilterSheet, UnifiedFilterValues, EMPTY_FILTERS } from '../components/filters/UnifiedFilterSheet';

type Nav = NativeStackNavigationProp<SearchStackParamList>;
type RouteT = RouteProp<SearchStackParamList, 'Search'>;

const CATEGORY_STYLES: Record<string, { bg: string; color: string }> = {
  gastronomia: { bg: '#EEF2FF', color: '#6366F1' },
  moda: { bg: '#EDE9FE', color: '#7C3AED' },
  viajes: { bg: '#E0F2FE', color: '#0284C7' },
};

function getMaxDiscount(b: Business): number {
  let max = 0;
  for (const ben of b.benefits) {
    const m = ben.rewardRate.match(/(\d+)%/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return max;
}

function getMaxInstallments(b: Business): number {
  let max = 0;
  for (const ben of b.benefits) {
    if (ben.installments && ben.installments > max) max = ben.installments;
  }
  return max;
}

function getBankBadges(b: Business): string[] {
  const seen = new Set<string>();
  const badges: string[] = [];
  for (const ben of b.benefits) {
    if (ben.bankName && !seen.has(ben.bankName)) {
      seen.add(ben.bankName);
      badges.push(toBankDescriptor(ben.bankName).code);
    }
  }
  return badges;
}

function BusinessRow({ business, onPress }: { business: Business; onPress: () => void }) {
  const catStyle = CATEGORY_STYLES[business.category] ?? { bg: '#DCFCE7', color: '#16A34A' };
  const maxDiscount = getMaxDiscount(business);
  const maxInstallments = getMaxInstallments(business);
  const bankBadges = getBankBadges(business);
  const visibleBadges = bankBadges.slice(0, 3);
  const remaining = bankBadges.length - 3;

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.rowInner}>
        {/* Logo */}
        <View
          style={[
            styles.logoBox,
            { backgroundColor: business.image ? '#F7F6F4' : catStyle.bg },
          ]}
        >
          {business.image ? (
            <Image source={{ uri: business.image }} style={styles.logoImage} resizeMode="contain" />
          ) : (
            <Text style={[styles.logoInitial, { color: catStyle.color }]}>
              {business.name?.charAt(0)}
            </Text>
          )}
        </View>

        {/* Info */}
        <View style={styles.rowInfo}>
          {/* Name row */}
          <View style={styles.nameRow}>
            <Text style={styles.rowName} numberOfLines={1}>{business.name}</Text>
            {(business.distanceText || business.distance !== undefined) && (
              <>
                <Text style={styles.nameDot}>·</Text>
                <Text style={styles.distanceText} numberOfLines={1}>
                  {business.distanceText || `${Math.round(business.distance! / 100) / 10}km`}
                </Text>
              </>
            )}
          </View>

          {/* Bank badges + benefit count */}
          <View style={styles.badgesRow}>
            {visibleBadges.map((badge) => (
              <View key={`${business.id}-${badge}`} style={styles.bankBadge}>
                <Text style={styles.bankBadgeText}>{badge}</Text>
              </View>
            ))}
            {remaining > 0 && (
              <View style={styles.bankBadgeExtra}>
                <Text style={styles.bankBadgeExtraText}>+{remaining}</Text>
              </View>
            )}
            <Text style={styles.benefitCount}>
              {business.benefits.length} {business.benefits.length !== 1 ? 'beneficios' : 'beneficio'}
            </Text>
          </View>
        </View>

        {/* Right column: max discount or installments */}
        {maxDiscount > 0 ? (
          <View style={styles.discountCol}>
            <Text style={styles.discountHasta}>hasta</Text>
            <Text style={styles.discountNum}>{maxDiscount}%</Text>
            <Text style={styles.discountOff}>OFF</Text>
          </View>
        ) : maxInstallments > 0 ? (
          <View style={styles.discountCol}>
            <Text style={[styles.discountHasta, { color: '#818CF8' }]}>hasta</Text>
            <Text style={[styles.discountNum, { color: '#6366F1' }]}>{maxInstallments}</Text>
            <Text style={[styles.discountOff, { color: '#818CF8' }]}>cuotas</Text>
          </View>
        ) : (
          <View style={styles.discountColEmpty} />
        )}

        <ChevronRight size={16} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();

  const [query, setQuery] = useState(route.params?.q || '');
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [filterValues, setFilterValues] = useState<UnifiedFilterValues>({
    ...EMPTY_FILTERS,
    selectedCategory: route.params?.category || '',
    selectedBanks: route.params?.bank ? [route.params.bank] : [],
  });
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  const filters: BenefitsFilters = {
    search: debouncedQuery.trim() || undefined,
    category: filterValues.selectedCategory || undefined,
    bank: filterValues.selectedBanks.length > 0 ? filterValues.selectedBanks.join(',') : undefined,
    onlineOnly: filterValues.onlineOnly,
    sortByDistance: filterValues.sortByDistance,
  };

  const { businesses, isLoading, isLoadingMore, hasMore, loadMore, totalBusinesses, proximityUnavailable } =
    useBenefitsData(filters);

  const enriched = useEnrichedBusinesses(businesses, {
    minDiscount: filterValues.minDiscount,
    maxDistance: undefined,
    availableDay: filterValues.availableDay,
    network: undefined,
    cardMode: filterValues.cardMode,
    hasInstallments: filterValues.hasInstallments === true ? true : undefined,
  });

  const bankOptions = useMemo(
    () => buildBankOptions(businesses.flatMap((b) => b.benefits.map((ben) => ben.bankName))),
    [businesses],
  );

  const activeFilterCount = [
    filterValues.selectedBanks.length > 0,
    !!filterValues.selectedCategory,
    filterValues.minDiscount !== undefined,
    filterValues.availableDay !== undefined,
    filterValues.cardMode !== undefined,
    filterValues.onlineOnly,
    filterValues.hasInstallments === true,
    filterValues.sortByDistance,
  ].filter(Boolean).length;

  type QuickFilter = {
    key: string;
    label: string;
    active: boolean;
    toggle: () => void;
  };

  const allQuickFilters: QuickFilter[] = [
    {
      key: 'sortByDistance',
      label: 'Más cercanos',
      active: filterValues.sortByDistance,
      toggle: () => setFilterValues((f) => ({ ...f, sortByDistance: !f.sortByDistance })),
    },
    {
      key: 'onlineOnly',
      label: 'Online',
      active: filterValues.onlineOnly,
      toggle: () => setFilterValues((f) => ({ ...f, onlineOnly: !f.onlineOnly })),
    },
    {
      key: 'hasInstallments',
      label: 'Cuotas s/int.',
      active: filterValues.hasInstallments === true,
      toggle: () =>
        setFilterValues((f) => ({ ...f, hasInstallments: f.hasInstallments === true ? undefined : true })),
    },
    {
      key: 'discount20',
      label: '20%+ desc.',
      active: filterValues.minDiscount === 20,
      toggle: () => setFilterValues((f) => ({ ...f, minDiscount: f.minDiscount === 20 ? undefined : 20 })),
    },
  ];

  // Active pills float to front
  const sortedFilters = [...allQuickFilters.filter((f) => f.active), ...allQuickFilters.filter((f) => !f.active)];

  const goToBusiness = (b: Business) =>
    navigation.navigate('BusinessDetail', { businessId: b.id, business: b });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronRight size={22} color="#6B7280" style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>

          <View style={styles.searchField}>
            <Search size={16} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar tiendas y beneficios..."
              placeholderTextColor="#9CA3AF"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <X size={15} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
            onPress={() => setFilterSheetOpen(true)}
          >
            <SlidersHorizontal size={18} color={activeFilterCount > 0 ? '#fff' : '#6B7280'} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick filter pills — active ones floated to front */}
        <FlatList
          data={sortedFilters}
          keyExtractor={(i) => i.key}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.pill, item.active && styles.pillActive]}
              onPress={item.toggle}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, item.active && styles.pillTextActive]}>{item.label}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Proximity warning */}
      {proximityUnavailable && (
        <View style={styles.proxWarning}>
          <MapPin size={14} color="#C2410C" />
          <Text style={styles.proxWarningText}>Activá tu ubicación para ordenar por cercanía</Text>
        </View>
      )}

      {/* Results */}
      {isLoading && enriched.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
        <FlatList
          data={enriched}
          keyExtractor={(b) => b.id}
          renderItem={({ item }) => <BusinessRow business={item} onPress={() => goToBusiness(item)} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>Tiendas</Text>
              <View style={styles.resultsBadge}>
                <Text style={styles.resultsBadgeText}>{totalBusinesses} resultados</Text>
              </View>
            </View>
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#6366F1" style={{ padding: 16 }} />
            ) : !hasMore && enriched.length > 0 ? (
              <Text style={styles.listEnd}>— Fin de resultados —</Text>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <View style={styles.emptyIcon}>
                  <Search size={28} color="#6366F1" />
                </View>
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySub}>Probá con otro término o filtro</Text>
              </View>
            ) : null
          }
        />
      )}

      <UnifiedFilterSheet
        visible={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        bankOptions={bankOptions}
        values={filterValues}
        onApply={(v) => setFilterValues(v)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },

  // Header
  header: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,230,225,0.8)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F7F6F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F7F6F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1C1C1E', padding: 0 },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F7F6F4',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { fontSize: 9, fontWeight: '700', color: '#6366F1' },
  pillsRow: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  pill: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    backgroundColor: '#F7F6F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  pillText: { fontSize: 13, fontWeight: '500', color: '#1C1C1E' },
  pillTextActive: { color: '#fff' },

  // Proximity warning
  proxWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7AA',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  proxWarningText: { fontSize: 13, color: '#C2410C' },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // List
  list: { paddingHorizontal: 14, paddingBottom: 100 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  resultsTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  resultsBadge: { backgroundColor: '#EEF2FF', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  resultsBadgeText: { fontSize: 12, fontWeight: '600', color: '#4338CA' },
  listEnd: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', paddingVertical: 16 },

  // Row
  row: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.07)',
  },
  logoImage: { width: 36, height: 36 },
  logoInitial: { fontSize: 18, fontWeight: '900' },
  rowInfo: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  rowName: { fontSize: 13.5, fontWeight: '700', color: '#1C1C1E', flexShrink: 1 },
  nameDot: { fontSize: 13, color: '#9CA3AF', flexShrink: 0 },
  distanceText: { fontSize: 11, color: '#9CA3AF', flexShrink: 0 },
  badgesRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'nowrap' },
  bankBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bankBadgeText: { fontSize: 8, fontWeight: '900', color: '#E2E8F0', letterSpacing: 0.5 },
  bankBadgeExtra: {
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  bankBadgeExtraText: { fontSize: 8, fontWeight: '700', color: '#94A3B8' },
  benefitCount: { fontSize: 10, color: '#9CA3AF', marginLeft: 4 },

  // Discount column
  discountCol: { minWidth: 38, alignItems: 'center' },
  discountColEmpty: { width: 38 },
  discountHasta: { fontSize: 7, fontWeight: '700', color: '#22C55E', textTransform: 'uppercase', letterSpacing: 0.8 },
  discountNum: { fontSize: 22, fontWeight: '900', color: '#16A34A', lineHeight: 24 },
  discountOff: { fontSize: 8, fontWeight: '700', color: '#22C55E', letterSpacing: 0.8, textTransform: 'uppercase' },

  // Empty state
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },
});
