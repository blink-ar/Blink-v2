import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { X, Search, Check } from 'lucide-react-native';
import { BankDescriptor, buildBankOptions } from '../../utils/banks';
import { CATEGORY_DATA, DISCOUNT_OPTIONS, DAY_OPTIONS } from '../../constants';

export interface UnifiedFilterValues {
  selectedBanks: string[];
  selectedCategory: string;
  minDiscount: number | undefined;
  availableDay: string | undefined;
  cardMode: 'credit' | 'debit' | undefined;
  onlineOnly: boolean;
  hasInstallments: boolean | undefined;
  sortByDistance: boolean;
}

export const EMPTY_FILTERS: UnifiedFilterValues = {
  selectedBanks: [],
  selectedCategory: '',
  minDiscount: undefined,
  availableDay: undefined,
  cardMode: undefined,
  onlineOnly: false,
  hasInstallments: undefined,
  sortByDistance: false,
};

interface UnifiedFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  bankOptions: BankDescriptor[];
  values: UnifiedFilterValues;
  onApply: (values: UnifiedFilterValues) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function UnifiedFilterSheet({
  visible,
  onClose,
  bankOptions,
  values,
  onApply,
}: UnifiedFilterSheetProps) {
  const [draft, setDraft] = useState<UnifiedFilterValues>(values);
  const [bankSearch, setBankSearch] = useState('');
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setDraft(values);
      setBankSearch('');
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredBankOptions = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return bankOptions;
    return bankOptions.filter(
      (o) =>
        o.code.toLowerCase().includes(q) ||
        o.label.toLowerCase().includes(q) ||
        o.token.toLowerCase().includes(q),
    );
  }, [bankOptions, bankSearch]);

  const toggleBank = (token: string) => {
    setDraft((d) => ({
      ...d,
      selectedBanks: d.selectedBanks.includes(token)
        ? d.selectedBanks.filter((t) => t !== token)
        : [...d.selectedBanks, token],
    }));
  };

  const activeCount = [
    draft.selectedBanks.length > 0,
    !!draft.selectedCategory,
    draft.minDiscount !== undefined,
    draft.availableDay !== undefined,
    draft.cardMode !== undefined,
    draft.onlineOnly,
    draft.hasInstallments === true,
    draft.sortByDistance,
  ].filter(Boolean).length;

  const clearAll = () => setDraft(EMPTY_FILTERS);

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filtros</Text>
          <View style={styles.headerActions}>
            {activeCount > 0 && (
              <TouchableOpacity onPress={clearAll} style={styles.clearBtn}>
                <Text style={styles.clearText}>Limpiar ({activeCount})</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {/* Banks */}
          <SectionLabel label="Banco / Tarjeta" />
          <View style={styles.searchBox}>
            <Search size={14} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar banco..."
              placeholderTextColor="#9CA3AF"
              value={bankSearch}
              onChangeText={setBankSearch}
            />
          </View>
          <View style={styles.bankGrid}>
            {filteredBankOptions.map((bank) => {
              const active = draft.selectedBanks.includes(bank.token);
              return (
                <TouchableOpacity
                  key={bank.token}
                  style={[styles.bankTile, active && styles.bankTileActive]}
                  onPress={() => toggleBank(bank.token)}
                >
                  {active && <Check size={10} color="#fff" style={styles.bankCheck} />}
                  <Text style={styles.bankCode}>{bank.code}</Text>
                  <Text style={[styles.bankLabel, active && styles.bankLabelActive]} numberOfLines={1}>
                    {bank.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Categories */}
          <SectionLabel label="Categoría" />
          <View style={styles.catGrid}>
            {CATEGORY_DATA.map((cat) => {
              const active = draft.selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catTile, active && { backgroundColor: cat.bg, borderColor: cat.text }]}
                  onPress={() =>
                    setDraft((d) => ({ ...d, selectedCategory: active ? '' : cat.id }))
                  }
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.catLabel, active && { color: cat.text }]} numberOfLines={1}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Discount */}
          <SectionLabel label="Descuento mínimo" />
          <View style={styles.pillRow}>
            {DISCOUNT_OPTIONS.map((opt) => {
              const active = draft.minDiscount === opt.value;
              return (
                <TogglePill
                  key={opt.value}
                  active={active}
                  onPress={() =>
                    setDraft((d) => ({ ...d, minDiscount: active ? undefined : opt.value }))
                  }
                >
                  {opt.label}
                </TogglePill>
              );
            })}
          </View>

          {/* Day */}
          <SectionLabel label="Disponible" />
          <View style={styles.pillRow}>
            {DAY_OPTIONS.map((opt) => {
              const active = draft.availableDay === opt.value;
              return (
                <TogglePill
                  key={opt.value}
                  active={active}
                  onPress={() =>
                    setDraft((d) => ({ ...d, availableDay: active ? undefined : opt.value }))
                  }
                >
                  {opt.label}
                </TogglePill>
              );
            })}
          </View>

          {/* Card mode */}
          <SectionLabel label="Tipo de tarjeta" />
          <View style={styles.pillRow}>
            {(['credit', 'debit'] as const).map((mode) => {
              const active = draft.cardMode === mode;
              return (
                <TogglePill
                  key={mode}
                  active={active}
                  onPress={() =>
                    setDraft((d) => ({ ...d, cardMode: active ? undefined : mode }))
                  }
                >
                  {mode === 'credit' ? 'Crédito' : 'Débito'}
                </TogglePill>
              );
            })}
          </View>

          {/* More options */}
          <SectionLabel label="Más opciones" />
          <View style={styles.toggleRow}>
            <TogglePill
              active={draft.onlineOnly}
              onPress={() => setDraft((d) => ({ ...d, onlineOnly: !d.onlineOnly }))}
            >
              Solo online
            </TogglePill>
            <TogglePill
              active={draft.hasInstallments === true}
              onPress={() =>
                setDraft((d) => ({
                  ...d,
                  hasInstallments: d.hasInstallments === true ? undefined : true,
                }))
              }
            >
              Cuotas s/int
            </TogglePill>
            <TogglePill
              active={draft.sortByDistance}
              onPress={() => setDraft((d) => ({ ...d, sortByDistance: !d.sortByDistance }))}
            >
              Más cercanos
            </TogglePill>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Apply */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>
              Aplicar{activeCount > 0 ? ` (${activeCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <Text style={sectionStyles.label}>{label.toUpperCase()}</Text>
  );
}

function TogglePill({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <TouchableOpacity
      style={[pillStyles.pill, active && pillStyles.pillActive]}
      onPress={onPress}
    >
      <Text style={[pillStyles.text, active && pillStyles.textActive]}>{children}</Text>
    </TouchableOpacity>
  );
}

const sectionStyles = StyleSheet.create({
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 20,
    marginBottom: 10,
  },
});

const pillStyles = StyleSheet.create({
  pill: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  pillActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  text: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  textActive: {
    color: '#fff',
  },
});

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.92,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
  },
  clearText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  closeBtn: {
    padding: 4,
  },
  body: {
    paddingHorizontal: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1C1C1E',
    padding: 0,
  },
  bankGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bankTile: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
  },
  bankTileActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  bankCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  bankCode: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
  },
  bankLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  bankLabelActive: {
    color: 'rgba(255,255,255,0.8)',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catTile: {
    width: '30%',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 4,
  },
  catEmoji: {
    fontSize: 20,
  },
  catLabel: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  applyBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
