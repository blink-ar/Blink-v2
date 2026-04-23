import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, SlidersHorizontal, X, MapPin, Wifi, CreditCard, Percent, ChevronRight } from 'lucide-react-native';
import type { SearchStackParamList } from '../types/navigation';
import type { Business } from '../types';
import { useBenefitsData, BenefitsFilters } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { buildBankOptions } from '../utils/banks';
import { UnifiedFilterSheet, UnifiedFilterValues, EMPTY_FILTERS } from '../components/filters/UnifiedFilterSheet';
import { CATEGORY_MAP } from '../constants';

type Nav = NativeStackNavigationProp<SearchStackParamList>;
type RouteT = RouteProp<SearchStackParamList, 'Search'>;

function getMaxDiscount(b: Business): number {
  let max = 0;
  for (const ben of b.benefits) {
    const m = ben.rewardRate.match(/(\d+)%/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return max;
}

function BusinessRow({ business, onPress }: { business: Business; onPress: () => void }) {
  const cat = CATEGORY_MAP[business.category] || { bg: '#F3F4F6', text: '#374151', emoji: '✨' };
  const maxDiscount = getMaxDiscount(business);
  const banks = [...new Set(business.benefits.map((b) => b.bankName?.split(' ')[0] || 'BANCO'))].slice(0, 3);
  const hasInstallments = business.benefits.some((b) => b.installments && b.installments > 0);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, { backgroundColor: cat.bg }]}>
        <Text style={styles.rowEmoji}>{cat.emoji}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName} numberOfLines={1}>{business.name}</Text>
          {maxDiscount > 0 && (
            <Text style={styles.rowDiscount}>{maxDiscount}%</Text>
          )}
        </View>
        <View style={styles.rowMeta}>
          {business.distanceText && (
            <View style={styles.metaChip}>
              <MapPin size={10} color='#9CA3AF' />
              <Text style={styles.metaText}>{business.distanceText}</Text>
            </View>
          )}
          {banks.map((bank) => (
            <View key={bank} style={styles.bankChip}>
              <Text style={styles.bankChipText}>{bank}</Text>
            </View>
          ))}
          {hasInstallments && (
            <View style={[styles.metaChip, styles.installChip]}>
              <CreditCard size={10} color='#6366F1' />
              <Text style={[styles.metaText, { color: '#6366F1' }]}>Cuotas</Text>
            </View>
          )}
        </View>
        <Text style={styles.rowBenefitCount}>
          {business.benefits.length} beneficio{business.benefits.length !== 1 ? 's' : ''}
        </Text>
      </View>
      <ChevronRight size={16} color='#D1D5DB' />
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
  const inputRef = useRef<TextInput>(null);

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
    subscription: undefined,
  };

  const { businesses, isLoading, isLoadingMore, hasMore, loadMore, refreshData, totalBusinesses, proximityUnavailable } =
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

  // Quick filter pills
  const quickFilters = [
    {
      key: 'sortByDistance',
      label: '📍 Cercanos',
      active: filterValues.sortByDistance,
      toggle: () => setFilterValues((f) => ({ ...f, sortByDistance: !f.sortByDistance })),
    },
    {
      key: 'onlineOnly',
      label: '🌐 Online',
      active: filterValues.onlineOnly,
      toggle: () => setFilterValues((f) => ({ ...f, onlineOnly: !f.onlineOnly })),
    },
    {
      key: 'hasInstallments',
      label: '💳 Cuotas s/int',
      active: filterValues.hasInstallments === true,
      toggle: () =>
        setFilterValues((f) => ({
          ...f,
          hasInstallments: f.hasInstallments === true ? undefined : true,
        })),
    },
    {
      key: 'discount20',
      label: '💸 20%+',
      active: filterValues.minDiscount === 20,
      toggle: () =>
        setFilterValues((f) => ({ ...f, minDiscount: f.minDiscount === 20 ? undefined : 20 })),
    },
  ];

  const goToBusiness = (b: Business) =>
    navigation.navigate('BusinessDetail', { businessId: b.id, business: b });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <View style={styles.searchField}>
          <Search size={16} color='#9CA3AF' />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Buscar comercios, categorías..."
            placeholderTextColor='#9CA3AF'
            value={query}
            onChangeText={setQuery}
            returnKeyType='search'
            autoCapitalize='none'
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={15} color='#9CA3AF' />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, activeFilterCount > 0 && styles.filterBtnActive]}
          onPress={() => setFilterSheetOpen(true)}
        >
          <SlidersHorizontal size={17} color={activeFilterCount > 0 ? '#fff' : '#374151'} />
          {activeFilterCount > 0 && (
            <Text style={styles.filterBadge}>{activeFilterCount}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick filter pills */}
      <FlatList
        data={quickFilters}
        keyExtractor={(i) => i.key}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickFilters}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.quickPill, item.active && styles.quickPillActive]}
            onPress={item.toggle}
          >
            <Text style={[styles.quickPillText, item.active && styles.quickPillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Proximity warning */}
      {proximityUnavailable && (
        <View style={styles.proxWarning}>
          <MapPin size={13} color='#B45309' />
          <Text style={styles.proxWarningText}>
            Activá la ubicación para ordenar por distancia
          </Text>
        </View>
      )}

      {/* Results */}
      {isLoading && enriched.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color='#6366F1' />
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
            totalBusinesses > 0 ? (
              <Text style={styles.resultCount}>{totalBusinesses} resultados</Text>
            ) : null
          }
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size='small' color='#6366F1' style={{ padding: 16 }} />
            ) : !hasMore && enriched.length > 0 ? (
              <Text style={styles.listEnd}>— Fin de resultados —</Text>
            ) : null
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.empty}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyTitle}>Sin resultados</Text>
                <Text style={styles.emptySub}>Intentá con otro término o ajustá los filtros.</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1C1C1E', padding: 0 },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  filterBtnActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  filterBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  quickFilters: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  quickPill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fff',
  },
  quickPillActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  quickPillText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  quickPillTextActive: { color: '#fff' },
  proxWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  proxWarningText: { fontSize: 12, color: '#B45309' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  resultCount: { fontSize: 12, color: '#9CA3AF', paddingVertical: 8, fontWeight: '500' },
  listEnd: { textAlign: 'center', fontSize: 12, color: '#D1D5DB', paddingVertical: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 22 },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  rowName: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', flex: 1 },
  rowDiscount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  rowMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 3 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  metaText: { fontSize: 10, color: '#9CA3AF' },
  installChip: { backgroundColor: '#EEF2FF' },
  bankChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  bankChipText: { fontSize: 10, color: '#6B7280', fontWeight: '600' },
  rowBenefitCount: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#1C1C1E', marginBottom: 6 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 20 },
});
