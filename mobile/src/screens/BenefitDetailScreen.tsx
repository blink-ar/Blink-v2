import React, { useEffect, useState, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types/navigation';
import { Business, BankBenefit, CanonicalLocation } from '../types';
import { RawMongoBenefit } from '../types/mongodb';
import { getRawBenefitById, getRawBenefits } from '../services/rawBenefitsApi';
import { useBusinessesData } from '../hooks/useBenefitsData';
import StoreHeader from '../components/StoreHeader';
import StoreInformation from '../components/StoreInformation';
import { BankBenefitGroup } from '../components/BankBenefitGroup';
import BenefitDetailModal from '../components/BenefitDetailModal';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { colors, borderRadius } from '../constants/theme';

type RouteProps = RouteProp<RootStackParamList, 'BenefitDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function BenefitDetailScreen() {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavProp>();
  const { businessId, benefitIndex, openDetails } = route.params;

  const { businesses, isLoading: businessesLoading, error: businessesError } = useBusinessesData();

  const [rawBenefit, setRawBenefit] = useState<RawMongoBenefit | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [benefit, setBenefit] = useState<BankBenefit | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetailedView, setShowDetailedView] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<CanonicalLocation | null>(null);
  const [activeTab, setActiveTab] = useState<'benefits' | 'info'>('benefits');

  const groupedBenefits = useMemo(() => {
    if (!business) return {};
    return business.benefits.reduce((acc, b) => {
      const bank = b.bankName;
      if (!acc[bank]) acc[bank] = [];
      acc[bank].push(b);
      return acc;
    }, {} as Record<string, BankBenefit[]>);
  }, [business]);

  useEffect(() => {
    const load = async () => {
      try {
        if (businessesLoading) return;
        if (businessesError) { setError(businessesError); setLoading(false); return; }
        if (business && benefit) return;

        // Try MongoDB ID first
        if (businessId && businessId.length === 24) {
          const rawData = await getRawBenefitById(businessId);
          if (rawData) {
            setRawBenefit(rawData);
            const converted: BankBenefit = {
              bankName: rawData.bank,
              cardName: rawData.cardTypes[0]?.name || 'Credit Card',
              benefit: rawData.benefitTitle,
              rewardRate: `${rawData.discountPercentage}%`,
              color: 'bg-blue-500', icon: 'CreditCard', tipo: 'descuento',
              cuando: rawData.availableDays.join(', '),
              valor: `${rawData.discountPercentage}%`,
              condicion: rawData.termsAndConditions,
              requisitos: [rawData.cardTypes[0]?.name || 'Tarjeta de crédito'],
              usos: rawData.online ? ['online', 'presencial'] : ['presencial'],
              textoAplicacion: rawData.link,
              description: rawData.description || rawData.benefitTitle,
              installments: rawData.installments || null,
            };

            const biz: Business = {
              id: rawData._id.$oid,
              name: rawData.merchant.name,
              category: rawData.categories[0] || 'otros',
              description: `Business offering ${rawData.benefitTitle}`,
              rating: 5,
              location: rawData.locations?.map((loc) => ({
                placeId: loc.placeId, lat: loc.lat || 0, lng: loc.lng || 0,
                formattedAddress: loc.formattedAddress || 'Address not available',
                name: loc.name, addressComponents: loc.addressComponents, types: loc.types,
                source: (['latlng', 'address', 'name'].includes(loc.source) ? loc.source : 'address') as any,
                provider: 'google' as const, confidence: loc.confidence || 0.5,
                raw: loc.raw || '', meta: loc.meta || null,
                updatedAt: loc.updatedAt || new Date().toISOString(),
              })) || [],
              image: '', benefits: [converted],
            };

            setBusiness(biz);
            setBenefit(converted);
            setError(null);
            return;
          }
        }

        // Find from cached businesses
        const match = businesses.find(
          (b) => b.id === businessId || b.name.toLowerCase().replace(/\s+/g, '-') === businessId
        );

        if (match && benefitIndex !== undefined) {
          const selected = match.benefits[benefitIndex];
          if (selected) {
            setBusiness({ ...match, location: match.location || [] });
            setBenefit(selected);
            setError(null);
            return;
          }
        }

        setBusiness(null);
        setBenefit(null);
        setError('Benefit not found');
      } catch {
        setError('Failed to load benefit');
      } finally {
        if (!businessesLoading) setLoading(false);
      }
    };

    if (!businessesLoading) load();
  }, [businessId, benefitIndex, businesses, businessesLoading, businessesError]);

  useEffect(() => {
    if (openDetails && business && benefit && !loading) {
      setShowDetailedView(true);
    }
  }, [openDetails, business, benefit, loading]);

  useEffect(() => {
    if (business && !selectedLocation) {
      const valid = business.location.filter((loc) => loc.lat !== 0 || loc.lng !== 0);
      if (valid.length === 1) setSelectedLocation(valid[0]);
    }
  }, [business, selectedLocation]);

  if (loading) return <LoadingSpinner message="Cargando beneficio..." />;
  if (error) return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );
  if (!business || !benefit) return null;

  return (
    <View style={styles.container}>
      <StoreHeader business={business} onBack={() => navigation.goBack()} />

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TabButton
          title={`Beneficios (${business.benefits.length})`}
          active={activeTab === 'benefits'}
          onPress={() => setActiveTab('benefits')}
        />
        <TabButton
          title="Información"
          active={activeTab === 'info'}
          onPress={() => setActiveTab('info')}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'benefits' ? (
          <View style={styles.benefitsContainer}>
            {Object.entries(groupedBenefits)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([bankName, benefits]) => (
                <BankBenefitGroup
                  key={bankName}
                  bankName={bankName}
                  benefits={benefits}
                  defaultExpanded
                  onBenefitSelect={(b) => { setBenefit(b); setShowDetailedView(true); }}
                />
              ))}
          </View>
        ) : (
          <View style={styles.infoContainer}>
            <StoreInformation
              business={business}
              selectedLocation={selectedLocation}
              onLocationSelect={setSelectedLocation}
            />
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      <BenefitDetailModal
        benefit={benefit}
        rawBenefit={rawBenefit}
        isOpen={showDetailedView}
        onClose={() => setShowDetailedView(false)}
      />
    </View>
  );
}

const TabButton: React.FC<{ title: string; active: boolean; onPress: () => void }> = ({
  title, active, onPress,
}) => (
  <View style={[styles.tab, active && styles.tabActive]}>
    <Text
      style={[styles.tabText, active && styles.tabTextActive]}
      onPress={onPress}
    >
      {title}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[50],
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[500],
  },
  tabTextActive: {
    color: colors.primary[600],
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  benefitsContainer: {
    padding: 16,
  },
  infoContainer: {
    padding: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: colors.red[500],
    textAlign: 'center',
  },
});
