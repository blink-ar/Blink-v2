import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { CATEGORY_DATA } from '../../constants';

interface CategoryMarqueeProps {
  onCategoryPress?: (categoryId: string) => void;
}

const ROW1 = CATEGORY_DATA.slice(0, 7);
const ROW2 = CATEGORY_DATA.slice(7);
const TILE_WIDTH = 110;

function MarqueeRow({
  items,
  speed = 25000,
  reverse = false,
  onPress,
}: {
  items: typeof ROW1;
  speed?: number;
  reverse?: boolean;
  onPress?: (id: string) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const totalWidth = items.length * TILE_WIDTH;

  useEffect(() => {
    const start = reverse ? -totalWidth : 0;
    const end = reverse ? 0 : -totalWidth;
    translateX.setValue(start);
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: end,
        duration: speed,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX, totalWidth, speed, reverse]);

  const doubled = [...items, ...items];

  return (
    <View style={styles.rowContainer}>
      <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
        {doubled.map((cat, i) => (
          <TouchableOpacity
            key={`${cat.id}-${i}`}
            style={[styles.tile, { backgroundColor: cat.bg }]}
            onPress={() => onPress?.(cat.id)}
            activeOpacity={0.75}
          >
            <Text style={styles.emoji}>{cat.emoji}</Text>
            <Text style={[styles.label, { color: cat.text }]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
}

export function CategoryMarquee({ onCategoryPress }: CategoryMarqueeProps) {
  return (
    <View style={styles.container}>
      <MarqueeRow items={ROW1} speed={28000} onPress={onCategoryPress} />
      <MarqueeRow items={ROW2} speed={22000} reverse onPress={onCategoryPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    overflow: 'hidden',
  },
  rowContainer: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tile: {
    width: TILE_WIDTH,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
