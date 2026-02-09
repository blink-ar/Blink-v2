import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Header } from '../components/Header';
import { SearchBar } from '../components/filters/SearchBar';
import { FilterMenu } from '../components/filters/FilterMenu';
import CategoryGrid from '../components/filters/CategoryGrid';
import BankGrid from '../components/filters/BankGrid';
import BusinessCard from '../components/cards/BusinessCard';
import FeaturedBenefits from '../components/FeaturedBenefits';
import ActiveOffers from '../components/ActiveOffers';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useBenefitsData, BenefitsFilters } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { Business, Category } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { CATEGORY_DATA, BANK_DATA } from '../constants';
import { colors } from '../constants/theme';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type ActiveTab = 'inicio' | 'beneficios';

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute();

  // Derive initial tab from the bottom tab route name
  const tabFromRoute: ActiveTab = route.name === 'Beneficios' ? 'beneficios' : 'inicio';
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabFromRoute);

  // Sync activeTab whenever this tab screen gains focus
  useFocusEffect(
    useCallback(() => {
      setActiveTab(tabFromRoute);
      // Clear filters when switching back to Inicio tab
      if (tabFromRoute === 'inicio') {
        setSearchTerm('');
        setSelectedCategory('all');
        setSelectedBanks([]);
        setOnlineOnly(false);
        setMinDiscount(undefined);
        setCardMode(undefined);
        setHasInstallments(undefined);
      }
    }, [tabFromRoute])
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBanks, setSelectedBanks] = useState<string[]>([]);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Filter states
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState<number | undefined>(undefined);
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>(undefined);
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>(undefined);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Auto-switch to beneficios when typing
  useEffect(() => {
    if (searchTerm.trim() !== '' && activeTab !== 'beneficios') {
      setActiveTab('beneficios');
    }
  }, [searchTerm, activeTab]);

  const filters: BenefitsFilters = {
    search: debouncedSearchTerm.trim() || undefined,
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    bank: selectedBanks.length > 0 ? selectedBanks.join(',') : undefined,
    minDiscount,
    cardMode,
    hasInstallments,
  };

  const {
    businesses: paginatedBusinesses,
    featuredBenefits: rawBenefits,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refreshData,
    totalBusinesses,
  } = useBenefitsData(filters);

  const enrichedBusinesses = useEnrichedBusinesses(paginatedBusinesses, {
    onlineOnly,
    minDiscount,
    cardMode,
    hasInstallments,
  });

  const activeFilterCount = [onlineOnly, minDiscount !== undefined, cardMode !== undefined, hasInstallments !== undefined]
    .filter(Boolean).length;

  const shouldShowFilteredResults =
    searchTerm.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedBanks.length > 0 ||
    activeFilterCount > 0 ||
    activeTab === 'beneficios';

  const featuredBenefits = useMemo(() => rawBenefits.slice(0, 1), [rawBenefits]);

  const activeOffers = useMemo(
    () => enrichedBusinesses
      .filter((b) => b.benefits.some((ben) => ben.rewardRate.includes('%') || ben.rewardRate.includes('x')))
      .slice(0, 8),
    [enrichedBusinesses]
  );

  const santanderOffers = useMemo(
    () => enrichedBusinesses
      .filter((b) => b.benefits?.length > 0 && b.benefits.every((ben) => ben?.bankName?.toLowerCase().includes('santander')))
      .slice(0, 8),
    [enrichedBusinesses]
  );

  const bbvaOffers = useMemo(
    () => enrichedBusinesses
      .filter((b) => b.benefits?.length > 0 && b.benefits.every((ben) => ben?.bankName?.toLowerCase().includes('bbva')))
      .slice(0, 8),
    [enrichedBusinesses]
  );

  const foodOffers = useMemo(
    () => enrichedBusinesses.filter((b) => b.category?.toLowerCase() === 'gastronomia').slice(0, 8),
    [enrichedBusinesses]
  );

  const biggestDiscountOffers = useMemo(
    () => enrichedBusinesses
      .map((business) => {
        let maxDisc = 0;
        business.benefits.forEach((benefit) => {
          const match = benefit.rewardRate.match(/(\d+)%/);
          if (match) maxDisc = Math.max(maxDisc, parseInt(match[1]));
        });
        return { ...business, maxDiscount: maxDisc };
      })
      .filter((b) => b.maxDiscount > 0)
      .sort((a, b) => b.maxDiscount - a.maxDiscount)
      .slice(0, 8),
    [enrichedBusinesses]
  );

  const handleBusinessClick = useCallback((businessId: string) => {
    navigation.navigate('BenefitDetail', { businessId, benefitIndex: 0 });
  }, [navigation]);

  const handleBenefitSelect = useCallback((benefit: RawMongoBenefit) => {
    const match = paginatedBusinesses.find(
      (b) => b.name?.toLowerCase().includes(benefit.merchant?.name?.toLowerCase() || '')
    );
    if (match) {
      navigation.navigate('BenefitDetail', { businessId: match.id, benefitIndex: 0, openDetails: true });
    }
  }, [navigation, paginatedBusinesses]);

  const handleCategorySelect = useCallback((category: { id: string }) => {
    setSelectedCategory((prev) => prev === category.id ? 'all' : category.id);
  }, []);

  const handleBankSelect = useCallback((bank: { id: string }) => {
    setSelectedBanks((prev) =>
      prev.includes(bank.id) ? prev.filter((id) => id !== bank.id) : [...prev, bank.id]
    );
  }, []);

  const handleViewAllBenefits = useCallback(() => setActiveTab('beneficios'), []);

  const clearAllFilters = () => {
    setOnlineOnly(false);
    setMinDiscount(undefined);
    setCardMode(undefined);
    setHasInstallments(undefined);
  };

  // Render Inicio tab content
  const renderInicioContent = () => (
    <View>
      <FeaturedBenefits benefits={featuredBenefits} onBenefitSelect={handleBenefitSelect} />

      {santanderOffers.length > 0 && (
        <ActiveOffers
          businesses={santanderOffers}
          onBusinessClick={handleBusinessClick}
          onViewAll={() => { setSelectedBanks(['santander']); setActiveTab('beneficios'); }}
          title="Exclusivos Santander"
        />
      )}

      {bbvaOffers.length > 0 && (
        <ActiveOffers
          businesses={bbvaOffers}
          onBusinessClick={handleBusinessClick}
          onViewAll={() => { setSelectedBanks(['bbva']); setActiveTab('beneficios'); }}
          title="Exclusivos BBVA"
        />
      )}

      {foodOffers.length > 0 && (
        <ActiveOffers
          businesses={foodOffers}
          onBusinessClick={handleBusinessClick}
          onViewAll={() => { setSelectedCategory('gastronomia'); setActiveTab('beneficios'); }}
          title="Ofertas de Comida"
        />
      )}

      <ActiveOffers
        businesses={activeOffers}
        onBusinessClick={handleBusinessClick}
        onViewAll={handleViewAllBenefits}
      />

      {biggestDiscountOffers.length > 0 && (
        <ActiveOffers
          businesses={biggestDiscountOffers}
          onBusinessClick={handleBusinessClick}
          onViewAll={handleViewAllBenefits}
          title="Mayores Descuentos"
        />
      )}

      <View style={{ height: 80 }} />
    </View>
  );

  // Render Beneficios tab content as FlatList
  const renderBeneficiosHeader = () => (
    <View>
      <CategoryGrid
        categories={CATEGORY_DATA}
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />
      <BankGrid
        banks={BANK_DATA}
        onBankSelect={handleBankSelect}
        selectedBanks={selectedBanks}
      />
      {totalBusinesses > 0 && (
        <Text style={styles.resultCount}>
          {totalBusinesses} comercios encontrados
        </Text>
      )}
    </View>
  );

  const renderFooter = () => {
    if (isLoadingMore) {
      return (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color={colors.primary[600]} />
          <Text style={styles.loadingText}>Cargando más...</Text>
        </View>
      );
    }
    if (!hasMore && enrichedBusinesses.length > 0) {
      return (
        <Text style={styles.endText}>No hay más resultados</Text>
      );
    }
    return null;
  };

  // Loading skeleton
  if (isLoading && !enrichedBusinesses.length) {
    return (
      <View style={styles.container}>
        <Header />
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          showFilter={activeTab !== 'inicio'}
          activeFilterCount={activeFilterCount}
          onFilterClick={() => setShowFilterMenu(true)}
        />
        <View style={styles.skeletonContainer}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        showFilter={activeTab !== 'inicio'}
        activeFilterCount={activeFilterCount}
        onFilterClick={() => setShowFilterMenu(true)}
      />

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {shouldShowFilteredResults ? (
        <FlatList
          data={enrichedBusinesses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <BusinessCard business={item} onClick={handleBusinessClick} />
            </View>
          )}
          ListHeaderComponent={renderBeneficiosHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyText}>No se encontraron resultados</Text>
            </View>
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refreshData} tintColor={colors.primary[600]} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={[1]}
          keyExtractor={() => 'inicio'}
          renderItem={() => renderInicioContent()}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={refreshData} tintColor={colors.primary[600]} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      <FilterMenu
        visible={showFilterMenu}
        onClose={() => setShowFilterMenu(false)}
        onlineOnly={onlineOnly}
        onOnlineChange={setOnlineOnly}
        minDiscount={minDiscount}
        onMinDiscountChange={setMinDiscount}
        cardMode={cardMode}
        onCardModeChange={setCardMode}
        hasInstallments={hasInstallments}
        onHasInstallmentsChange={setHasInstallments}
        onClearAll={clearAllFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  skeletonContainer: {
    padding: 16,
    gap: 8,
  },
  cardWrapper: {
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 100,
  },
  resultCount: {
    fontSize: 12,
    color: colors.gray[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: colors.gray[500],
  },
  endText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.gray[400],
    padding: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.red[600],
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray[500],
  },
});
