import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface SavingsSimulatorProps {
  discountPercentage: number;
  maxCap?: string | null;
}

const PRESETS = [5000, 10000, 15000, 25000];

export function SavingsSimulator({ discountPercentage, maxCap }: SavingsSimulatorProps) {
  const [amount, setAmount] = useState(12000);
  const [customInput, setCustomInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const { savings, total, cappedSavings } = useMemo(() => {
    const raw = Math.round((amount * discountPercentage) / 100);
    let cap = Infinity;
    if (maxCap) {
      const numStr = String(maxCap).replace(/[^0-9]/g, '');
      if (numStr) cap = parseInt(numStr, 10);
    }
    const capped = Math.min(raw, cap);
    return { savings: raw, total: amount - capped, cappedSavings: capped };
  }, [amount, discountPercentage, maxCap]);

  const fmt = (n: number) => `$${n.toLocaleString('es-AR')}`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Simulación de ahorro</Text>
        <View style={styles.iconBox}>
          <Text style={{ fontSize: 14 }}>🧮</Text>
        </View>
      </View>

      {/* Amount selection */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
        {isEditing ? (
          <View style={styles.editingBox}>
            <Text style={styles.currencyPrefix}>$</Text>
            <TextInput
              ref={inputRef}
              style={styles.editInput}
              keyboardType="numeric"
              autoFocus
              value={customInput}
              onChangeText={(raw) => {
                const digits = raw.replace(/[^0-9]/g, '');
                setCustomInput(digits);
                if (digits) setAmount(parseInt(digits, 10));
              }}
              onSubmitEditing={() => { if (customInput) setIsEditing(false); }}
              onBlur={() => { if (!customInput) setIsEditing(false); }}
              placeholder="Monto"
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity onPress={() => { if (customInput) setIsEditing(false); }} style={{ paddingHorizontal: 8 }}>
              <Text style={{ color: '#6366F1', fontSize: 13, fontWeight: '700' }}>✓</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.preset, customInput ? styles.presetActive : styles.presetOutline]}
            onPress={() => { setIsEditing(true); setCustomInput(''); }}
          >
            <Text style={[styles.presetText, customInput ? styles.presetTextActive : styles.presetTextOutline]}>
              {customInput ? fmt(amount) : 'Tu monto'} ✎
            </Text>
          </TouchableOpacity>
        )}
        {PRESETS.map((p) => {
          const active = amount === p && !customInput;
          return (
            <TouchableOpacity
              key={p}
              style={[styles.preset, active ? styles.presetActive : styles.presetOutline]}
              onPress={() => { setAmount(p); setCustomInput(''); setIsEditing(false); }}
            >
              <Text style={[styles.presetText, active ? styles.presetTextActive : styles.presetTextOutline]}>
                {fmt(p)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <View style={styles.results}>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>Consumo estimado</Text>
          <Text style={styles.strikethrough}>{fmt(amount)}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.discountLabel}>Descuento ({discountPercentage}%)</Text>
          <Text style={styles.discountValue}>−{fmt(cappedSavings)}</Text>
        </View>
        {maxCap && savings > cappedSavings && (
          <View style={styles.resultRow}>
            <Text style={styles.topeLabel}>Tope aplicado</Text>
            <Text style={styles.topeValue}>{maxCap}</Text>
          </View>
        )}
        <View style={styles.divider} />
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalValue}>{fmt(total)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#F7F6F4',
    borderWidth: 1,
    borderColor: '#E8E6E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 14, fontWeight: '600', color: '#1C1C1E' },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetRow: { marginBottom: 16 },
  preset: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  presetActive: { backgroundColor: '#6366F1' },
  presetOutline: { backgroundColor: '#F7F6F4', borderWidth: 1, borderColor: '#E8E6E1' },
  presetText: { fontSize: 12, fontWeight: '500' },
  presetTextActive: { color: '#fff' },
  presetTextOutline: { color: '#1C1C1E' },
  editingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 12,
    backgroundColor: '#fff',
    marginRight: 8,
    paddingLeft: 10,
  },
  currencyPrefix: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },
  editInput: {
    width: 90,
    paddingVertical: 7,
    paddingHorizontal: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  results: { gap: 10 },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: { fontSize: 13, color: '#6B7280' },
  strikethrough: { fontSize: 13, color: '#9CA3AF', textDecorationLine: 'line-through', fontWeight: '500' },
  discountLabel: { fontSize: 13, color: '#16A34A', fontWeight: '500' },
  discountValue: { fontSize: 13, color: '#16A34A', fontWeight: '600' },
  topeLabel: { fontSize: 11, color: '#9CA3AF' },
  topeValue: { fontSize: 11, color: '#9CA3AF' },
  divider: { height: 1, backgroundColor: '#E8E6E1', marginVertical: 4 },
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
  },
  totalLabel: { fontSize: 13, fontWeight: '600', color: '#1C1C1E' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#6366F1' },
});
