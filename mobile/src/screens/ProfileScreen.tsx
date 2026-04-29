import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Bell, Shield, ChevronRight, Info } from 'lucide-react-native';

const MENU_ITEMS = [
  { icon: Bell, label: 'Notificaciones', sub: 'Próximamente' },
  { icon: Shield, label: 'Privacidad', sub: 'Política de privacidad' },
  { icon: Info, label: 'Acerca de Blink', sub: 'v1.0.0' },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <User size={32} color="#6366F1" />
          </View>
          <Text style={styles.greeting}>Mi perfil</Text>
          <Text style={styles.sub}>Personalizá tu experiencia en Blink</Text>
        </View>

        <View style={styles.card}>
          {MENU_ITEMS.map(({ icon: Icon, label, sub }, i) => (
            <TouchableOpacity
              key={label}
              style={[styles.menuItem, i < MENU_ITEMS.length - 1 && styles.menuBorder]}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <Icon size={18} color="#6366F1" />
              </View>
              <View style={styles.menuBody}>
                <Text style={styles.menuLabel}>{label}</Text>
                {sub && <Text style={styles.menuSub}>{sub}</Text>}
              </View>
              <ChevronRight size={16} color="#D1D5DB" />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.footer}>
          Blink · Encontrá los mejores beneficios{'\n'}de tus tarjetas en un solo lugar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F6F4' },
  header: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 20 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 24, fontWeight: '800', color: '#1C1C1E', marginBottom: 6 },
  sub: { fontSize: 14, color: '#9CA3AF', textAlign: 'center' },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBody: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '600', color: '#1C1C1E' },
  menuSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#D1D5DB',
    paddingVertical: 32,
    lineHeight: 18,
  },
});
