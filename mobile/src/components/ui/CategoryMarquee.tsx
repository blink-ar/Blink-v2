import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, TouchableOpacity } from 'react-native';

const CATEGORIES = [
  { id: 'gastronomia', label: 'Gastronomía', emoji: '🍕', bg: '#EEF2FF', text: '#4338CA' },
  { id: 'moda', label: 'Moda', emoji: '👗', bg: '#FCE7F3', text: '#9D174D' },
  { id: 'entretenimiento', label: 'Entretenimiento', emoji: '🎮', bg: '#EDE9FE', text: '#4C1D95' },
  { id: 'deportes', label: 'Deportes', emoji: '⚽', bg: '#D1FAE5', text: '#065F46' },
  { id: 'regalos', label: 'Regalos', emoji: '🎁', bg: '#FEE2E2', text: '#991B1B' },
  { id: 'viajes', label: 'Viajes', emoji: '✈️', bg: '#DBEAFE', text: '#1E40AF' },
  { id: 'automotores', label: 'Automotores', emoji: '🚗', bg: '#F3F4F6', text: '#374151' },
  { id: 'belleza', label: 'Belleza', emoji: '💄', bg: '#FDF2F8', text: '#831843' },
  { id: 'jugueterias', label: 'Jugueterías', emoji: '🧸', bg: '#EEF2FF', text: '#78350F' },
  { id: 'hogar', label: 'Hogar', emoji: '🏠', bg: '#ECFDF5', text: '#064E3B' },
  { id: 'electro', label: 'Electro', emoji: '💻', bg: '#EEF2FF', text: '#312E81' },
  { id: 'shopping', label: 'Supermercado', emoji: '🛒', bg: '#F0FDF4', text: '#14532D' },
  { id: 'otros', label: 'Otros', emoji: '📦', bg: '#F8FAFC', text: '#475569' },
];

const row1 = CATEGORIES.slice(0, 7);
const row2 = CATEGORIES.slice(7);

interface CategoryMarqueeProps {
  onCategoryPress?: (categoryId: string) => void;
}

function MarqueeRow({
  items,
  speed = 22000,
  reverse = false,
  onPress,
}: {
  items: typeof row1;
  speed?: number;
  reverse?: boolean;
  onPress?: (id: string) => void;
}) {
  const translateX = useRef(new Animated.Value(reverse ? -700 : 0)).current;

  useEffect(() => {
    const start = reverse ? -700 : 0;
    const end = reverse ? 0 : -700;
    translateX.setValue(start);
    const anim = Animated.loop(
      Animated.timing(translateX, { toValue: end, duration: speed, useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX, speed, reverse]);

  const doubled = [...items, ...items];

  return (
    <View style={styles.rowWrap}>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        {doubled.map((cat, i) => (
          <TouchableOpacity
            key={`${cat.id}-${i}`}
            style={[styles.pill, { backgroundColor: cat.bg, borderColor: `${cat.text}20` }]}
            onPress={() => onPress?.(cat.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.pillText}>
              {cat.emoji} {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

export function CategoryMarquee({ onCategoryPress }: CategoryMarqueeProps) {
  return (
    <View style={styles.section}>
      <MarqueeRow items={row1} speed={26000} onPress={onCategoryPress} />
      <View style={{ height: 10 }} />
      <MarqueeRow items={row2} speed={20000} reverse onPress={onCategoryPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingVertical: 16,
    backgroundColor: '#F7F6F4',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E8E6E1',
    overflow: 'hidden',
  },
  rowWrap: { overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 4,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
});
