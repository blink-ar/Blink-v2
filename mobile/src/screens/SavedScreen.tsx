import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bookmark, Trash2, ChevronRight } from 'lucide-react-native';
import type { SavedStackParamList } from '../types/navigation';
import { useSavedBenefits, SavedBenefitEntry } from '../hooks/useSavedBenefits';
import { CATEGORY_MAP } from '../constants';

type Nav = NativeStackNavigationProp<SavedStackParamList>;

function SavedRow({ entry, onPress, onRemove }: { entry: SavedBenefitEntry; onPress: () => void; onRemove: () => void }) {
  const cat = CATEGORY_MAP[entry.business.category] || { bg: '#F3F4F6', text: '#374151', emoji: '✨' };
  const discount = entry.benefit.rewardRate.match(/(\d+)%/);
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.rowIcon, { backgroundColor: cat.bg }]}>
        <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowBusiness} numberOfLines={1}>{entry.business.name}</Text>
        <Text style={styles.rowBank}>{entry.benefit.bankName}</Text>
        <Text style={styles.rowBenefit} numberOfLines={2}>{entry.benefit.benefit}</Text>
        {discount && <Text style={styles.rowDiscount}>{discount[1]}% OFF</Text>}
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Trash2 size={16} color="#EF4444" />
        </TouchableOpacity>
        <ChevronRight size={16} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );
}

export default function SavedScreen() {
  const navigation = useNavigation<Nav>();
  const { saved, unsaveBenefit } = useSavedBenefits();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Bookmark size={22} color="#6366F1" fill="#6366F1" />
        <Text style={styles.headerTitle}>Guardados</Text>
        {saved.length > 0 && (
          <Text style={styles.headerCount}>{saved.length}</Text>
        )}
      </View>
      <FlatList
        data={saved}
        keyExtractor={(e) => `${e.businessId}-${e.benefitIndex}`}
        renderItem={({ item }) => (
          <SavedRow
            entry={item}
            onPress={() =>
              navigation.navigate('BenefitDetail', {
                businessId: item.businessId,
                benefitIndex: item.benefitIndex,
                business: item.business,
              })
            }
            onRemove={() => unsaveBenefit(item.businessId, item.benefitIndex)}
          />
        )}
        contentContainerStyle={saved.length === 0 ? styles.emptyContainer : styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Bookmark size={48} color="#E5E7EB" />
            <Text style={styles.emptyTitle}>Sin guardados aún</Text>
            <Text style={styles.emptySub}>
              Guardá tus beneficios favoritos tocando el corazón en cada uno.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E1',
    backgroundColor: '#F7F6F4',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1C1C1E', flex: 1 },
  headerCount: {
    backgroundColor: '#6366F1',
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },
  emptyContainer: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
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
  rowBody: { flex: 1 },
  rowBusiness: { fontSize: 14, fontWeight: '700', color: '#1C1C1E', marginBottom: 2 },
  rowBank: { fontSize: 11, fontWeight: '600', color: '#6366F1', textTransform: 'uppercase', marginBottom: 3 },
  rowBenefit: { fontSize: 12, color: '#6B7280', lineHeight: 17 },
  rowDiscount: { fontSize: 13, fontWeight: '800', color: '#6366F1', marginTop: 4 },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  removeBtn: { padding: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#1C1C1E', marginTop: 16, marginBottom: 8 },
  emptySub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32, lineHeight: 20 },
});
