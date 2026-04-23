import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Heart, Share2, MapPin, ChevronDown, ChevronUp, CreditCard, Clock } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import type { HomeStackParamList } from '../types/navigation';
import type { Business, BankBenefit } from '../types';
import { fetchBusinessById } from '../services/api';
import { useSavedBenefits } from '../hooks/useSavedBenefits';
import { DaysOfWeekBar } from '../components/ui/DaysOfWeekBar';
import { SavingsSimulator } from '../components/ui/SavingsSimulator';
import { CATEGORY_MAP } from '../constants';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'BenefitDetail'>;

function Expandable({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={expStyles.container}>
      <TouchableOpacity style={expStyles.header} onPress={() => setOpen((v) => !v)} activeOpacity={0.7}>
        <Text style={expStyles.title}>{title}</Text>
        {open ? <ChevronUp size={16} color="#6B7280" /> : <ChevronDown size={16} color="#6B7280" />}
      </TouchableOpacity>
      {open && <View style={expStyles.body}>{children}</View>}
    </View>
  );
}

const expStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  body: { padding: 14, paddingTop: 0, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
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
  const saved = business ? isSaved(businessId, benefitIndex) : false;

  const cat = business ? CATEGORY_MAP[business.category] || { bg: '#312E81', text: '#818CF8', emoji: '✨' } : null;

  const discountValue = useMemo(() => {
    if (!benefit) return 0;
    const m = benefit.rewardRate.match(/(\d+)%/);
    return m ? parseInt(m[1]) : 0;
  }, [benefit]);

  const topeValue = useMemo(() => {
    if (!benefit?.tope) return undefined;
    const m = benefit.tope.match(/\$?([\d.,]+)/);
    if (!m) return undefined;
    return parseFloat(m[1].replace('.', '').replace(',', '.'));
  }, [benefit]);

  const handleShare = async () => {
    if (!business || !benefit) return;
    try {
      await Share.share({
        title: `${business.name} - ${benefit.bankName}`,
        message: `${benefit.benefit}\n\n${business.name} — Blink`,
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

  const cardTypes = benefit.cardTypes || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Hero */}
      <View style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroNav}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <ChevronLeft size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.navRight}>
              <TouchableOpacity
                onPress={() => toggleBenefit(business, benefitIndex)}
                style={styles.navBtn}
              >
                <Heart
                  size={20}
                  color="#fff"
                  fill={saved ? '#fff' : 'none'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleShare} style={styles.navBtn}>
                <Share2 size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <Text style={styles.heroEmoji}>{cat?.emoji || '✨'}</Text>
          <Text style={styles.heroBusinessName}>{business.name}</Text>
          <View style={styles.heroBadges}>
            <View style={styles.bankBadge}>
              <Text style={styles.bankBadgeText}>{benefit.bankName}</Text>
            </View>
            {benefit.cardName && (
              <View style={styles.cardBadge}>
                <CreditCard size={10} color="#C7D2FE" />
                <Text style={styles.cardBadgeText}>{benefit.cardName}</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Main benefit card */}
        <View style={styles.mainCard}>
          {discountValue > 0 ? (
            <View style={styles.discountBlock}>
              <Text style={styles.discountNum}>{discountValue}</Text>
              <Text style={styles.discountPct}>%</Text>
              <Text style={styles.discountOff}>OFF</Text>
            </View>
          ) : benefit.installments && benefit.installments > 0 ? (
            <View style={styles.installBlock}>
              <Text style={styles.installNum}>{benefit.installments}</Text>
              <Text style={styles.installLabel}>cuotas{'\n'}sin interés</Text>
            </View>
          ) : null}

          <Text style={styles.benefitTitle}>{benefit.benefit}</Text>

          {benefit.cuando && (
            <View style={styles.daysRow}>
              <DaysOfWeekBar cuando={benefit.cuando} />
            </View>
          )}

          {benefit.description && (
            <Text style={styles.description}>{benefit.description}</Text>
          )}

          {benefit.validUntil && (
            <View style={styles.validUntil}>
              <Clock size={12} color="#9CA3AF" />
              <Text style={styles.validText}>Válido hasta {benefit.validUntil}</Text>
            </View>
          )}
        </View>

        {/* Savings simulator */}
        {discountValue > 0 && (
          <View style={styles.section}>
            <SavingsSimulator discountRate={discountValue} topeCap={topeValue} />
          </View>
        )}

        {/* Expandable sections */}
        <View style={styles.section}>
          {benefit.condicion && (
            <Expandable title="Términos y condiciones">
              <Text style={styles.expandableText}>{benefit.condicion}</Text>
            </Expandable>
          )}
          {business.location && business.location.length > 0 && (
            <Expandable title="Sucursales adheridas">
              {business.location.map((loc, i) => (
                <Text key={i} style={styles.expandableText}>
                  • {loc.formattedAddress || loc.name || `${loc.lat}, ${loc.lng}`}
                </Text>
              ))}
            </Expandable>
          )}
          {(cardTypes.length > 0 || benefit.cardName) && (
            <Expandable title="Tarjetas adheridas">
              {cardTypes.length > 0 ? (
                cardTypes.map((ct, i) => (
                  <Text key={i} style={styles.expandableText}>• {ct}</Text>
                ))
              ) : (
                <Text style={styles.expandableText}>{benefit.cardName}</Text>
              )}
            </Expandable>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.mapBtn}
          onPress={() => (navigation as any).getParent()?.navigate('MapTab', { business: businessId })}
          activeOpacity={0.85}
        >
          <MapPin size={16} color="#fff" />
          <Text style={styles.mapBtnText}>Ver ubicación</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const HERO_BG = '#312E81';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#6B7280' },
  hero: { backgroundColor: HERO_BG, paddingBottom: 28 },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  navBtn: { padding: 8 },
  navRight: { flexDirection: 'row', gap: 4 },
  heroContent: { paddingHorizontal: 20, paddingTop: 8 },
  heroEmoji: { fontSize: 36, marginBottom: 8 },
  heroBusinessName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 30,
  },
  heroBadges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  bankBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bankBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  cardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  cardBadgeText: { fontSize: 12, color: '#C7D2FE' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },
  mainCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  discountBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  discountNum: { fontSize: 80, fontWeight: '900', color: '#6366F1', lineHeight: 88 },
  discountPct: { fontSize: 32, fontWeight: '800', color: '#6366F1', marginBottom: 14 },
  discountOff: { fontSize: 18, fontWeight: '700', color: '#9CA3AF', marginBottom: 18, marginLeft: 4 },
  installBlock: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 16,
  },
  installNum: { fontSize: 80, fontWeight: '900', color: '#6366F1', lineHeight: 88 },
  installLabel: { fontSize: 16, fontWeight: '700', color: '#374151', marginBottom: 18, lineHeight: 22 },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    lineHeight: 24,
    marginBottom: 14,
  },
  daysRow: { marginBottom: 14 },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 21,
    marginBottom: 12,
  },
  validUntil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginTop: 4,
  },
  validText: { fontSize: 12, color: '#9CA3AF' },
  section: { paddingHorizontal: 16, marginBottom: 4 },
  expandableText: { fontSize: 13, color: '#6B7280', lineHeight: 20, marginBottom: 4 },
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
