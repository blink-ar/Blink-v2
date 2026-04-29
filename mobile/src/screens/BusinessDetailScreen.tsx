import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import type { HomeStackParamList } from '../types/navigation';
import type { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { useSavedBenefits } from '../hooks/useSavedBenefits';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'BusinessDetail'>;

const getBankAccent = (name: string): { bg: string; text: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('galicia'))   return { bg: '#EEF2FF', text: '#4338CA' };
  if (lower.includes('santander')) return { bg: '#FEE2E2', text: '#991B1B' };
  if (lower.includes('bbva'))      return { bg: '#DBEAFE', text: '#1E40AF' };
  if (lower.includes('macro'))     return { bg: '#EEF2FF', text: '#78350F' };
  if (lower.includes('nacion'))    return { bg: '#DBEAFE', text: '#1D4ED8' };
  if (lower.includes('hsbc'))      return { bg: '#FEE2E2', text: '#B91C1C' };
  if (lower.includes('icbc'))      return { bg: '#FEE2E2', text: '#991B1B' };
  if (lower.includes('modo'))      return { bg: '#EDE9FE', text: '#5B21B6' };
  if (lower.includes('naranja'))   return { bg: '#FED7AA', text: '#9A3412' };
  if (lower.includes('ciudad'))    return { bg: '#D1FAE5', text: '#065F46' };
  return { bg: '#F3F4F6', text: '#374151' };
};

const bankAbbr = (name: string) =>
  name.replace(/banco\s*/i, '').substring(0, 6).toUpperCase();

const ALL_DAYS = ['lunes','martes','miércoles','miercoles','jueves','viernes','sábado','sabado','domingo'];
const DAY_ABBR: Record<string, string> = {
  lunes: 'Lun', martes: 'Mar', 'miércoles': 'Mié', miercoles: 'Mié',
  jueves: 'Jue', viernes: 'Vie', 'sábado': 'Sáb', sabado: 'Sáb', domingo: 'Dom',
};

const formatCuando = (cuando?: string): string => {
  if (!cuando) return 'Todos los días';
  const lower = cuando.toLowerCase();
  const unique = new Set(ALL_DAYS.filter((d) => lower.includes(d)).map((d) => DAY_ABBR[d]));
  if (unique.size >= 7) return 'Todos los días';
  let result = cuando;
  Object.entries(DAY_ABBR).forEach(([full, abbr]) => {
    result = result.replace(new RegExp(full, 'gi'), abbr);
  });
  return result;
};

export default function BusinessDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { businessId, business: passedBusiness } = route.params;
  const { isSaved, toggleBenefit } = useSavedBenefits();

  const { data: fetchedBusiness, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusinessById(businessId),
    enabled: !passedBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const business: Business | null = passedBusiness || fetchedBusiness || null;

  const sortedBenefits = useMemo(() => {
    if (!business) return [];
    return [...business.benefits].sort((a, b) => {
      const dA = parseInt(a.rewardRate.match(/(\d+)%/)?.[1] || '0');
      const dB = parseInt(b.rewardRate.match(/(\d+)%/)?.[1] || '0');
      if (dB !== dA) return dB - dA;
      return (b.installments || 0) - (a.installments || 0);
    });
  }, [business]);

  const topBenefits = sortedBenefits.slice(0, 2);
  const otherBenefits = sortedBenefits.slice(2);

  const goToBenefit = (selectedBenefit: BankBenefit) => {
    if (!business) return;
    const idx = business.benefits.indexOf(selectedBenefit);
    navigation.navigate('BenefitDetail', {
      businessId,
      benefitIndex: idx >= 0 ? idx : 0,
      business,
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  if (!business) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Comercio no encontrado</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Hero — light indigo gradient */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroNav}>
            <TouchableOpacity
              style={styles.glassBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.glassBtnText}>←</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.glassBtn}
              onPress={() => business.benefits.length > 0 && toggleBenefit(business, 0)}
            >
              <Text style={styles.glassBtnText}>
                {isSaved(businessId, 0) ? '❤️' : '🤍'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        <View style={styles.heroContent}>
          {/* Logo */}
          <View style={styles.logoBox}>
            {business.image ? (
              <Image source={{ uri: business.image }} style={styles.logo} resizeMode="contain" />
            ) : (
              <Text style={styles.logoInitial}>{business.name?.charAt(0)}</Text>
            )}
          </View>

          <Text style={styles.heroName}>{business.name}</Text>

          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>{business.category || 'Comercio'}</Text>
            </View>
            <View style={[styles.heroBadge, styles.activeBadge]}>
              <View style={styles.activeDot} />
              <Text style={[styles.heroBadgeText, { color: '#065F46' }]}>Activo</Text>
            </View>
            {business.rating > 0 && (
              <View style={styles.heroBadge}>
                <Text style={{ fontSize: 10 }}>⭐</Text>
                <Text style={[styles.heroBadgeText, { color: '#4338CA' }]}>
                  {business.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Top Benefits */}
        {topBenefits.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Mis beneficios</Text>
              <Text style={{ fontSize: 14 }}>✦</Text>
            </View>
            {topBenefits.map((benefit, idx) => {
              const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
              const isFirst = idx === 0;
              const accent = getBankAccent(benefit.bankName);
              return (
                <TouchableOpacity
                  key={`top-${idx}`}
                  style={[styles.topCard, isFirst && styles.topCardFirst]}
                  onPress={() => goToBenefit(benefit)}
                  activeOpacity={0.88}
                >
                  {/* Card top band */}
                  <View style={[styles.topCardBand, isFirst ? styles.bandFirst : styles.bandDefault]}>
                    <View style={styles.topCardBandHeader}>
                      <View style={[styles.bankPill, { backgroundColor: accent.bg }]}>
                        <Text style={[styles.bankPillText, { color: accent.text }]}>
                          {bankAbbr(benefit.bankName)}
                        </Text>
                      </View>
                      {isFirst ? (
                        <View style={styles.bestBadge}>
                          <Text style={styles.bestBadgeText}>Mejor opción</Text>
                        </View>
                      ) : benefit.cardName ? (
                        <Text style={styles.cardNameText}>
                          {String(benefit.cardName).replace(/ any$/i, '')}
                        </Text>
                      ) : null}
                    </View>

                    {discount && parseInt(discount) > 0 ? (
                      <View>
                        <View style={styles.discountRow}>
                          <Text style={[styles.discountBig, isFirst ? styles.discountBigFirst : styles.discountBigSecond]}>
                            {discount}%
                          </Text>
                          <Text style={styles.discountOffLabel}>OFF</Text>
                        </View>
                        {!!benefit.tope && (
                          <Text style={styles.topeText}>
                            {String(benefit.tope).toUpperCase().includes('SIN TOPE')
                              ? 'Sin tope de reintegro'
                              : `Tope: ${benefit.tope}`}
                          </Text>
                        )}
                        {(benefit.installments ?? 0) > 0 && (
                          <Text style={styles.installText}>
                            + {benefit.installments} cuotas s/int.
                          </Text>
                        )}
                      </View>
                    ) : benefit.installments && benefit.installments > 0 ? (
                      <View style={styles.discountRow}>
                        <Text style={[styles.discountBig, isFirst ? styles.discountBigFirst : styles.discountBigSecond]}>
                          {benefit.installments}
                        </Text>
                        <Text style={styles.discountOffLabel}>cuotas</Text>
                      </View>
                    ) : (
                      <Text style={styles.benefitFallback}>{benefit.benefit}</Text>
                    )}
                  </View>

                  {/* Card bottom */}
                  <View style={styles.topCardBottom}>
                    <View>
                      <Text style={styles.topCardBottomLabel}>Disponible</Text>
                      <Text style={styles.topCardBottomValue}>{formatCuando(benefit.cuando)}</Text>
                    </View>
                    <View style={styles.verDetalles}>
                      <Text style={styles.verDetallesText}>Ver detalles →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Other Benefits */}
        {otherBenefits.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Más beneficios</Text>
            <View style={styles.otherList}>
              {otherBenefits.map((benefit, idx) => {
                const discount = benefit.rewardRate.match(/(\d+)%/)?.[1];
                const accent = getBankAccent(benefit.bankName);
                return (
                  <TouchableOpacity
                    key={`other-${idx}`}
                    style={styles.otherRow}
                    onPress={() => goToBenefit(benefit)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.bankPill, { backgroundColor: accent.bg }]}>
                      <Text style={[styles.bankPillText, { color: accent.text }]}>
                        {bankAbbr(benefit.bankName)}
                      </Text>
                    </View>
                    <View style={styles.otherRowBody}>
                      <Text style={styles.otherRowMain}>
                        {discount && parseInt(discount) > 0
                          ? `${discount}% OFF`
                          : benefit.installments && benefit.installments > 0
                            ? `${benefit.installments} cuotas s/int.`
                            : benefit.benefit}
                      </Text>
                      {!!benefit.tope && (
                        <Text style={styles.otherRowTope}>{benefit.tope}</Text>
                      )}
                    </View>
                    <View style={styles.otherRowRight}>
                      <Text style={styles.otherRowCuando}>{formatCuando(benefit.cuando)}</Text>
                      <Text style={{ color: '#9CA3AF', fontSize: 16 }}>›</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => (navigation as any).getParent()?.navigate('MapTab', { business: businessId })}
          activeOpacity={0.88}
        >
          <Text style={{ fontSize: 18 }}>📍</Text>
          <Text style={styles.mapBtnText}>Ver ubicación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  backLink: { fontSize: 14, color: '#6366F1', fontWeight: '500' },
  hero: {
    background: undefined,
    backgroundColor: '#EEF2FF',
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassBtnText: { fontSize: 18 },
  heroContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  logoBox: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  logo: { width: '100%', height: '100%', padding: 8 },
  logoInitial: { fontSize: 32, fontWeight: '900', color: '#9CA3AF' },
  heroName: { fontSize: 22, fontWeight: '900', color: '#1C1C1E', marginBottom: 12, textAlign: 'center' },
  heroBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  activeBadge: {},
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22C55E' },
  heroBadgeText: { fontSize: 11, fontWeight: '600', color: '#374151' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  section: { paddingHorizontal: 16, paddingTop: 24 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1C1C1E', marginBottom: 12 },
  topCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  topCardFirst: {
    borderColor: '#C7D2FE',
    shadowColor: '#6366F1',
    shadowOpacity: 0.12,
  },
  topCardBand: { padding: 16, paddingBottom: 20 },
  bandFirst: { backgroundColor: '#EEF2FF' },
  bandDefault: { backgroundColor: '#FAFAFA' },
  topCardBandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bankPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bankPillText: { fontSize: 11, fontWeight: '700' },
  bestBadge: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bestBadgeText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  cardNameText: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  discountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  discountBig: {
    fontWeight: '700',
    color: '#6366F1',
    lineHeight: undefined,
  },
  discountBigFirst: { fontSize: 52 },
  discountBigSecond: { fontSize: 40 },
  discountOffLabel: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginBottom: 6 },
  topeText: { fontSize: 12, color: '#4338CA', fontWeight: '500', marginTop: 4 },
  installText: { fontSize: 13, color: '#9CA3AF', fontWeight: '500', marginTop: 2 },
  benefitFallback: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  topCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
  },
  topCardBottomLabel: { fontSize: 10, color: '#9CA3AF', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  topCardBottomValue: { fontSize: 13, fontWeight: '600', color: '#1C1C1E', marginTop: 2 },
  verDetalles: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  verDetallesText: { fontSize: 12, fontWeight: '600', color: '#4338CA' },
  otherList: { gap: 8 },
  otherRow: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  otherRowBody: { flex: 1 },
  otherRowMain: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  otherRowTope: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  otherRowRight: { alignItems: 'flex-end', gap: 2 },
  otherRowCuando: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  bottomBar: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
  },
  mapBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  mapBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
