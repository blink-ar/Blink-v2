import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  PanResponder,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Circle, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import { MapPin, Crosshair, ChevronRight } from 'lucide-react-native';
import type { MapStackParamList } from '../types/navigation';
import type { Business } from '../types';
import { useBusinessesData } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { useGeolocation } from '../hooks/useGeolocation';
import { encodeGeohash } from '../utils/geohash';
import { CATEGORY_MAP } from '../constants';

type Nav = NativeStackNavigationProp<MapStackParamList>;
type RouteT = RouteProp<MapStackParamList, 'Map'>;

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_PEEK = 200;
const SHEET_EXPANDED = SCREEN_H * 0.5;

function MapMarker({ business, selected, onPress }: { business: Business; selected: boolean; onPress: () => void }) {
  const cat = CATEGORY_MAP[business.category] || { bg: '#6366F1', text: '#fff', emoji: '📍' };
  return (
    <Marker
      coordinate={{
        latitude: business.location[0]?.lat ?? 0,
        longitude: business.location[0]?.lng ?? 0,
      }}
      onPress={onPress}
      tracksViewChanges={false}
    >
      <View style={[styles.marker, selected && styles.markerSelected, { backgroundColor: selected ? '#6366F1' : '#fff' }]}>
        <Text style={styles.markerEmoji}>{cat.emoji}</Text>
      </View>
    </Marker>
  );
}

function BusinessRowSmall({ business, onPress }: { business: Business; onPress: () => void }) {
  const cat = CATEGORY_MAP[business.category] || { bg: '#F3F4F6', text: '#374151', emoji: '✨' };
  const maxDiscount = Math.max(
    0,
    ...business.benefits.map((b) => {
      const m = b.rewardRate.match(/(\d+)%/);
      return m ? parseInt(m[1]) : 0;
    }),
  );
  return (
    <TouchableOpacity style={styles.sheetRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.sheetRowIcon, { backgroundColor: cat.bg }]}>
        <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
      </View>
      <View style={styles.sheetRowBody}>
        <Text style={styles.sheetRowName} numberOfLines={1}>{business.name}</Text>
        {maxDiscount > 0 && (
          <Text style={styles.sheetRowDiscount}>{maxDiscount}% OFF</Text>
        )}
      </View>
      <ChevronRight size={14} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const CATEGORY_CHIPS = [
  { id: '', label: '📍 Todos' },
  { id: 'gastronomia', label: '🍕 Gastronomía' },
  { id: 'moda', label: '👗 Moda' },
  { id: 'entretenimiento', label: '🎮 Entretenimiento' },
  { id: 'deportes', label: '⚽ Deportes' },
  { id: 'viajes', label: '✈️ Viajes' },
  { id: 'belleza', label: '💄 Belleza' },
];

export default function MapScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const { businesses, isLoading } = useBusinessesData();
  const enriched = useEnrichedBusinesses(businesses);
  const { position } = useGeolocation();

  const [selectedId, setSelectedId] = useState<string | null>(route.params?.business || null);
  const [activeCategory, setActiveCategory] = useState('');
  const mapRef = useRef<MapView>(null);
  const sheetY = useRef(new Animated.Value(SHEET_PEEK)).current;

  const filtered = useMemo(
    () => (activeCategory ? enriched.filter((b) => b.category === activeCategory) : enriched)
      .filter((b) => b.location && b.location.length > 0),
    [enriched, activeCategory],
  );

  const selected = useMemo(() => filtered.find((b) => b.id === selectedId) || null, [filtered, selectedId]);

  const expandSheet = () => {
    Animated.spring(sheetY, { toValue: SHEET_EXPANDED, useNativeDriver: false, tension: 60, friction: 12 }).start();
  };
  const collapseSheet = () => {
    Animated.spring(sheetY, { toValue: SHEET_PEEK, useNativeDriver: false, tension: 60, friction: 12 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gs) => {
        const newY = SHEET_PEEK + (-gs.dy);
        if (newY >= SHEET_PEEK && newY <= SHEET_EXPANDED) sheetY.setValue(newY);
      },
      onPanResponderRelease: (_, gs) => {
        if (-gs.dy > 40) expandSheet();
        else collapseSheet();
      },
    }),
  ).current;

  const handleMarkerPress = useCallback((business: Business) => {
    setSelectedId(business.id);
    if (business.location[0]) {
      mapRef.current?.animateToRegion({
        latitude: business.location[0].lat,
        longitude: business.location[0].lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 400);
    }
    expandSheet();
  }, []);

  const centerOnUser = () => {
    if (position) {
      mapRef.current?.animateToRegion({
        latitude: position.latitude,
        longitude: position.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const initialRegion = position
    ? { latitude: position.latitude, longitude: position.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : { latitude: -34.6037, longitude: -58.3816, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {filtered.map((business) => (
          <MapMarker
            key={business.id}
            business={business}
            selected={business.id === selectedId}
            onPress={() => handleMarkerPress(business)}
          />
        ))}
      </MapView>

      {/* Category chips */}
      <SafeAreaView style={styles.topOverlay} edges={['top']} pointerEvents="box-none">
        <FlatList
          data={CATEGORY_CHIPS}
          keyExtractor={(i) => i.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.chip, item.id === activeCategory && styles.chipActive]}
              onPress={() => setActiveCategory(item.id === activeCategory ? '' : item.id)}
            >
              <Text style={[styles.chipText, item.id === activeCategory && styles.chipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>

      {/* Recenter button */}
      <TouchableOpacity style={styles.recenter} onPress={centerOnUser}>
        <Crosshair size={20} color="#6366F1" />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <Animated.View style={[styles.sheet, { height: sheetY }]}>
        <View {...panResponder.panHandlers}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {selected ? selected.name : `${filtered.length} comercios`}
          </Text>
        </View>
        {selected ? (
          <TouchableOpacity
            style={styles.sheetSelected}
            onPress={() => navigation.navigate('BusinessDetail', { businessId: selected.id, business: selected })}
            activeOpacity={0.8}
          >
            <Text style={styles.sheetSelectedBenefits}>
              {selected.benefits.length} beneficio{selected.benefits.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.sheetSelectedCTA}>Ver todos los beneficios →</Text>
          </TouchableOpacity>
        ) : (
          <FlatList
            data={filtered.slice(0, 30)}
            keyExtractor={(b) => b.id}
            renderItem={({ item }) => (
              <BusinessRowSmall
                business={item}
                onPress={() => navigation.navigate('BusinessDetail', { businessId: item.id, business: item })}
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#6366F1" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topOverlay: { position: 'absolute', top: 0, left: 0, right: 0 },
  chips: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chipActive: { backgroundColor: '#6366F1', borderColor: '#6366F1' },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  recenter: {
    position: 'absolute',
    right: 16,
    bottom: SHEET_PEEK + 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  markerSelected: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  markerEmoji: { fontSize: 16 },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sheetRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowBody: { flex: 1 },
  sheetRowName: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  sheetRowDiscount: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  sheetSelected: {
    margin: 16,
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    padding: 16,
  },
  sheetSelectedBenefits: { fontSize: 14, color: '#374151', marginBottom: 6 },
  sheetSelectedCTA: { fontSize: 15, fontWeight: '700', color: '#6366F1' },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    left: '50%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 8,
  },
});
