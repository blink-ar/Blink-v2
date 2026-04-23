import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';

const MESSAGES = [
  '✦ Beneficios activos',
  '✦ Ahorrá hoy',
  '✦ Descubrí ofertas cerca tuyo',
  '✦ Cuotas sin interés',
  '✦ Cashback en tus compras',
  '✦ Descuentos exclusivos',
];

interface TickerProps {
  count?: number;
}

export function Ticker({ count }: TickerProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const containerWidth = 800;

  const messages = count
    ? [`✦ ${count.toLocaleString()} beneficios activos`, ...MESSAGES.slice(1)]
    : MESSAGES;

  const text = messages.join('   ');

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -containerWidth,
        duration: 18000,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        <Text style={styles.text}>{text + '   ' + text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  track: {
    flexDirection: 'row',
  },
  text: {
    color: '#F7F6F4',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    whiteSpace: 'nowrap',
  } as any,
});
