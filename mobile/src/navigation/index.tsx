import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import type { RootStackParamList } from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import BenefitDetailScreen from '../screens/BenefitDetailScreen';
import { colors } from '../constants/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function HomeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, !focused && styles.tabEmojiInactive]}>🏠</Text>
    </View>
  );
}

function BeneficiosTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.tabIcon}>
      <Text style={[styles.tabEmoji, !focused && styles.tabEmojiInactive]}>⭐</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.gray[200],
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: HomeTabIcon,
        }}
      />
      <Tab.Screen
        name="Beneficios"
        component={HomeScreen}
        options={{
          tabBarIcon: BeneficiosTabIcon,
        }}
        initialParams={{ tab: 'beneficios' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="HomeTabs" component={HomeTabs} />
        <Stack.Screen name="BenefitDetail" component={BenefitDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabEmoji: {
    fontSize: 20,
  },
  tabEmojiInactive: {
    opacity: 0.5,
  },
});
