import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';

interface SavingsSimulatorProps {
  discountRate: number;
  topeCap?: number;
}

const PRESETS = [5000, 10000, 15000, 25000];

export function SavingsSimulator({ discountRate, topeCap }: SavingsSimulatorProps) {
  const [selected, setSelected] = useState<number | null>(PRESETS[1]);
  const [custom, setCustom] = useState('');

  const amount = custom ? parseFloat(custom.replace(/[^0-9.]/g, '')) || 0 : selected ?? 0;

  const raw = amount * (discountRate / 100);
  const capped = topeCap !== undefined ? Math.min(raw, topeCap) : raw;
  const total = amount - capped;

  const fmt = (n: number) =>
    n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simulador de ahorro</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetRow}>
        {PRESETS.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.preset, selected === p && !custom && styles.presetActive]}
            onPress={() => { setSelected(p); setCustom(''); }}
          >
            <Text style={[styles.presetText, selected === p && !custom && styles.presetTextActive]}>
              {fmt(p)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Otro monto..."
        placeholderTextColor="#9CA3AF"
        value={custom}
        onChangeText={(t) => { setCustom(t); setSelected(null); }}
      />
      {amount > 0 && (
        <View style={styles.result}>
          <View style={styles.resultRow}>
            <Text style={styles.label}>Precio original</Text>
            <Text style={styles.strikethrough}>{fmt(amount)}</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.label}>Descuento ({discountRate}%)</Text>
            <Text style={styles.discount}>-{fmt(capped)}</Text>
          </View>
          {topeCap !== undefined && raw > topeCap && (
            <Text style={styles.tope}>Tope de descuento: {fmt(topeCap)}</Text>
          )}
          <View style={[styles.resultRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.total}>{fmt(total)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F0F4FF',
    borderRadius: 16,
    padding: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 12,
  },
  presetRow: {
    marginBottom: 10,
  },
  preset: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  presetActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  presetText: {
    fontSize: 13,
    color: '#4338CA',
    fontWeight: '500',
  },
  presetTextActive: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1C1C1E',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  result: {
    gap: 6,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: '#6B7280',
  },
  strikethrough: {
    fontSize: 13,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discount: {
    fontSize: 13,
    color: '#16A34A',
    fontWeight: '600',
  },
  tope: {
    fontSize: 11,
    color: '#6366F1',
    fontStyle: 'italic',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#C7D2FE',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  total: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D4ED8',
  },
});
