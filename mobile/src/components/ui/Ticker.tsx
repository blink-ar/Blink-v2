import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Text } from 'react-native';

interface TickerProps {
  count?: number;
}

export function Ticker({ count = 0 }: TickerProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const formatted = count.toLocaleString('es-AR');

  const items = [
    `✦ ${formatted} beneficios activos`,
    'Ahorrá hoy',
    `✦ ${formatted} beneficios activos`,
    'Descubrí ofertas',
    `✦ ${formatted} beneficios activos`,
    'Ahorrá hoy',
  ];

  const text = items.join('          ');

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: -600,
        duration: 14000,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        <Text style={styles.text}>{text + '          ' + text}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99,102,241,0.12)',
  },
  track: { flexDirection: 'row' },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(99,102,241,0.8)',
    letterSpacing: 0.3,
  } as any,
});
