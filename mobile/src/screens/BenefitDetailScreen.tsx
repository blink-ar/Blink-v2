import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  StatusBar,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Share2, MapPin, ChevronDown, ChevronUp, Gavel, Store, CreditCard } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import type { HomeStackParamList } from '../types/navigation';
import type { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { useSavedBenefits } from '../hooks/useSavedBenefits';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { parseDayAvailability } from '../utils/dayAvailabilityParser';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'BenefitDetail'>;

const BENEFIT_DAYS = [
  { key: 'monday' as const, abbr: 'L' },
  { key: 'tuesday' as const, abbr: 'M' },
  { key: 'wednesday' as const, abbr: 'M' },
  { key: 'thursday' as const, abbr: 'J' },
  { key: 'friday' as const, abbr: 'V' },
  { key: 'saturday' as const, abbr: 'S' },
  { key: 'sunday' as const, abbr: 'D' },
];

const getBankAccent = (name: string): { bg: string; text: string; border: string } => {
  const lower = name.toLowerCase();
  if (lower.includes('galicia')) return { bg: '#EEF2FF', text: '#4338CA', border: '#C7D2FE' };
  if (lower.includes('santander')) return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
  if (lower.includes('bbva')) return { bg: '#DBEAFE', text: '#1E40AF', border: '#BFDBFE' };
  if (lower.includes('macro')) return { bg: '#EEF2FF', text: '#78350F', border: '#C7D2FE' };
  if (lower.includes('nacion')) return { bg: '#DBEAFE', text: '#1D4ED8', border: '#BFDBFE' };
  if (lower.includes('hsbc')) return { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
  if (lower.includes('icbc')) return { bg: '#FEE2E2', text: '#991B1B', border: '#FECACA' };
  if (lower.includes('modo')) return { bg: '#EDE9FE', text: '#5B21B6', border: '#DDD6FE' };
  if (lower.includes('naranja')) return { bg: '#FED7AA', text: '#9A3412', border: '#FDBA74' };
  if (lower.includes('ciudad')) return { bg: '#D1FAE5', text: '#065F46', border: '#A7F3D0' };
  return { bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' };
};

function Expandable({
  title,
  icon,
  iconBg,
  iconColor,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View style={expStyles.container}>
      <TouchableOpacity style={expStyles.header} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <View style={expStyles.titleRow}>
          <View style={[expStyles.iconBox, { backgroundColor: iconBg }]}>{icon}</View>
          <Text style={expStyles.title}>{title}</Text>
        </View>
        {open ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
      </TouchableOpacity>
      {open && <View style={expStyles.body}>{children}</View>}
    </View>
  );
}

const expStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E8E6E1',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  body: { paddingHorizontal: 14, paddingBottom: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#E8E6E1' },
});

export default function BenefitDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { businessId, benefitIndex, business: passedBusiness } = route.params;

  const { data: fetchedBusiness, isLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => fetchBusinessById(businessId),
    enabled: !passedBusiness,
    staleTime: 5 * 60 * 1000,
  });

  const business: Business | null = passedBusiness || fetchedBusiness || null;
  const benefit: BankBenefit | null = business?.benefits[benefitIndex] || null;
  const { isSaved, toggleBenefit } = useSavedBenefits();
  const { getSubscriptionName } = useSubscriptions();
  const saved = business ? isSaved(businessId, benefitIndex) : false;

  const discount = useMemo(() => {
    if (!benefit) return 0;
    return parseInt(benefit.rewardRate.match(/(\d+)%/)?.[1] || '0', 10);
  }, [benefit]);

  const bankAccent = useMemo(() => (benefit ? getBankAccent(benefit.bankName) : null), [benefit]);

  const dayAvailability = useMemo(() => parseDayAvailability(benefit?.cuando), [benefit]);

  const subscriptionName = benefit ? getSubscriptionName(benefit.subscription) : null;

  const termsText = useMemo(() => {
    if (!benefit) return '';
    return [
      benefit.condicion,
      benefit.textoAplicacion,
      ...(benefit.requisitos || []),
      ...(benefit.usos || []),
    ]
      .filter(Boolean)
      .join('\n\n');
  }, [benefit]);

  const locations = useMemo(
    () => (business?.location || []).filter((l) => l.lat !== 0 || l.lng !== 0),
    [business],
  );

  const handleShare = async () => {
    if (!business || !benefit) return;
    try {
      await Share.share({
        title: `${business.name} · Blink`,
        message: `${benefit.description || benefit.benefit || ''}\n\n${business.name} — Blink`,
      });
    } catch {}
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

  if (!business || !benefit) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>No se pudo cargar el beneficio.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cardList = (benefit.cardTypes && benefit.cardTypes.length > 0)
    ? benefit.cardTypes
    : benefit.cardName ? [benefit.cardName] : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero — dark indigo gradient */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          {/* Nav row */}
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <ChevronLeft size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => toggleBenefit(business, benefitIndex)}
              style={[styles.navBtn, saved && styles.navBtnSaved]}
            >
              <Heart size={20} color="#fff" fill={saved ? '#fff' : 'none'} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>

        {/* Logo + business name + badge */}
        <View style={styles.heroContent}>
          <View style={styles.logoBox}>
            {business.image ? (
              <Image source={{ uri: business.image }} style={styles.logoImage} resizeMode="contain" />
            ) : (
              <Text style={styles.logoInitial}>{business.name?.charAt(0)}</Text>
            )}
          </View>
          <Text style={styles.heroName}>{business.name}</Text>
          <View style={styles.heroBadges}>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>
                {benefit.bankName}{benefit.cardName ? ` · ${benefit.cardName.replace(/ any$/i, '')}` : ''}
              </Text>
            </View>
            {subscriptionName && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{subscriptionName}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Main benefit card */}
        <View style={styles.mainCard}>
          {/* Discount / installments hero */}
          <View style={styles.discountHero}>
            {discount > 0 ? (
              <>
                <Text style={styles.label}>DESCUENTO</Text>
                <View style={styles.discountRow}>
                  <Text style={styles.discountNum}>{discount}</Text>
                  <View style={styles.discountSuffix}>
                    <Text style={styles.discountPct}>%</Text>
                    <Text style={styles.discountOff}>OFF</Text>
                  </View>
                </View>
                {benefit.installments != null && benefit.installments > 0 && (
                  <Text style={styles.plusInstallments}>+ {benefit.installments} cuotas sin interés</Text>
                )}
                <Text style={styles.topeText}>
                  {!benefit.tope || String(benefit.tope).toUpperCase().includes('SIN TOPE')
                    ? 'Sin tope de reintegro'
                    : `Tope: ${benefit.tope}`}
                </Text>
              </>
            ) : benefit.installments && benefit.installments > 0 ? (
              <>
                <Text style={styles.label}>CUOTAS SIN INTERÉS</Text>
                <View style={styles.discountRow}>
                  <Text style={styles.discountNum}>{benefit.installments}</Text>
                  <Text style={styles.installX}>x</Text>
                </View>
                <Text style={styles.topeText}>sin interés</Text>
                {benefit.tope && (
                  <Text style={styles.topeText}>
                    {String(benefit.tope).toUpperCase().includes('SIN TOPE')
                      ? 'Sin tope de reintegro'
                      : `Tope: ${benefit.tope}`}
                  </Text>
                )}
              </>
            ) : (
              <>
                <Text style={styles.label}>BENEFICIO</Text>
                <Text style={styles.plainBenefit}>{benefit.benefit}</Text>
              </>
            )}

            {/* Bank + card badges */}
            <View style={styles.cardBadgeRow}>
              {bankAccent && (
                <View style={[styles.bankBadge, { backgroundColor: bankAccent.bg, borderColor: bankAccent.border }]}>
                  <Text style={[styles.bankBadgeText, { color: bankAccent.text }]}>{benefit.bankName}</Text>
                </View>
              )}
              {cardList.map((card, i) => (
                <View key={i} style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{card.replace(/ any$/i, '')}</Text>
                </View>
              ))}
              {subscriptionName && (
                <View style={styles.cardBadge}>
                  <Text style={styles.cardBadgeText}>{subscriptionName}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Days of availability */}
          <View style={styles.daysSection}>
            <Text style={styles.daysSectionLabel}>DÍAS DE VIGENCIA</Text>
            <View style={styles.daysRow}>
              {BENEFIT_DAYS.map((day) => {
                const isActive = !!(dayAvailability?.allDays || dayAvailability?.[day.key]);
                return (
                  <View
                    key={day.key}
                    style={[styles.dayPill, isActive ? styles.dayPillActive : styles.dayPillInactive]}
                  >
                    <Text style={[styles.dayPillText, isActive ? styles.dayPillTextActive : styles.dayPillTextInactive]}>
                      {day.abbr}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Description */}
          {benefit.description && (
            <View style={styles.descSection}>
              <Text style={styles.descText}>{benefit.description}</Text>
            </View>
          )}

          {/* Footer row */}
          <View style={styles.footerRow}>
            <Text style={styles.footerNote}>* Por transacción. Consultá bases legales.</Text>
            {benefit.validUntil && (
              <Text style={styles.validUntil}>Válido hasta {benefit.validUntil}</Text>
            )}
          </View>
        </View>

        {/* Expandable sections */}
        <View style={styles.expandSection}>
          {termsText ? (
            <Expandable
              title="Términos y condiciones"
              iconBg="#EEF2FF"
              iconColor="#6366F1"
              icon={<Gavel size={16} color="#6366F1" />}
            >
              <Text style={styles.expandText}>{termsText}</Text>
            </Expandable>
          ) : null}

          <Expandable
            title="Sucursales adheridas"
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            icon={<Store size={16} color="#16A34A" />}
          >
            {locations.length > 0 ? (
              locations.map((loc, i) => (
                <View key={i} style={styles.locRow}>
                  <MapPin size={12} color="#9CA3AF" style={{ marginTop: 1 }} />
                  <Text style={styles.locText}>{loc.formattedAddress || 'Dirección no disponible'}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.expandText}>Sin sucursales registradas.</Text>
            )}
          </Expandable>

          {cardList.length > 0 && (
            <Expandable
              title="Tarjetas adheridas"
              iconBg="#EEF2FF"
              iconColor="#6366F1"
              icon={<CreditCard size={16} color="#6366F1" />}
            >
              {cardList.map((card, i) => (
                <View key={i} style={styles.locRow}>
                  <CreditCard size={12} color="#9CA3AF" />
                  <Text style={styles.locText}>{card.replace(/ any$/i, '')}</Text>
                </View>
              ))}
            </Expandable>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => (navigation as any).getParent()?.navigate('MapTab', { business: businessId })}
          activeOpacity={0.85}
        >
          <MapPin size={18} color="#fff" />
          <Text style={styles.mapBtnText}>Ver ubicación</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={() => void handleShare()} activeOpacity={0.8}>
          <Share2 size={18} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#6B7280' },

  // Hero
  hero: { background: undefined, backgroundColor: '#3730A3', paddingBottom: 28 },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnSaved: { backgroundColor: 'rgba(251,113,133,0.85)' },
  heroContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8 },
  logoBox: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.30,
    shadowRadius: 16,
    elevation: 8,
  },
  logoImage: { width: 64, height: 64 },
  logoInitial: { fontSize: 26, fontWeight: '900', color: '#6366F1' },
  heroName: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 26,
  },
  heroBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4, paddingHorizontal: 14 },

  // Main card
  mainCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E6E1',
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  discountHero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  discountRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  discountNum: { fontSize: 96, fontWeight: '900', color: '#6366F1', lineHeight: 82 },
  discountSuffix: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 4 },
  discountPct: { fontSize: 34, fontWeight: '900', color: '#818CF8', lineHeight: 36 },
  discountOff: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: '#9CA3AF', textTransform: 'uppercase' },
  installX: { fontSize: 28, fontWeight: '700', color: '#818CF8', marginBottom: 6 },
  plusInstallments: { fontSize: 12, fontWeight: '600', color: '#059669', marginTop: 10 },
  topeText: { fontSize: 12, fontWeight: '500', color: '#9CA3AF', marginTop: 6 },
  plainBenefit: { fontSize: 16, fontWeight: '700', color: '#1C1C1E', textAlign: 'center', marginTop: 8 },
  cardBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18, justifyContent: 'center' },
  bankBadge: {
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  bankBadgeText: { fontSize: 12, fontWeight: '600' },
  cardBadge: {
    backgroundColor: '#F9FAFB',
    borderRadius: 100,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
  cardBadgeText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },

  // Days section
  daysSection: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
  },
  daysSectionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  daysRow: { flexDirection: 'row', gap: 5 },
  dayPill: {
    flex: 1,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillActive: { backgroundColor: '#6366F1' },
  dayPillInactive: { backgroundColor: '#F3F4F6' },
  dayPillText: { fontSize: 12, fontWeight: '600' },
  dayPillTextActive: { color: '#fff' },
  dayPillTextInactive: { color: '#9CA3AF' },

  // Description section
  descSection: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
  },
  descText: { fontSize: 14, color: '#1C1C1E', lineHeight: 22 },

  // Footer row
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
  },
  footerNote: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic', flex: 1 },
  validUntil: { fontSize: 10, color: '#9CA3AF', fontWeight: '500' },

  // Expandable sections
  expandSection: { marginBottom: 4 },
  expandText: { fontSize: 12, color: '#6B7280', lineHeight: 20, paddingTop: 12 },
  locRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start', paddingTop: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8 },
  locText: { fontSize: 12, color: '#6B7280', flex: 1, lineHeight: 18 },

  // Bottom bar
  bottomBar: {
    padding: 14,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderTopWidth: 1,
    borderTopColor: '#E8E6E1',
    flexDirection: 'row',
    gap: 10,
  },
  mapBtn: {
    flex: 1,
    backgroundColor: '#6366F1',
    borderRadius: 16,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: 'rgba(99,102,241,1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 12,
    elevation: 4,
  },
  mapBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareBtn: {
    width: 52,
    backgroundColor: '#F7F6F4',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E8E6E1',
  },
});
