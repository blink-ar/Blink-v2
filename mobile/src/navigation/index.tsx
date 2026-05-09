import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Home, Search, Map, Bookmark, User } from 'lucide-react-native';
import type {
  RootTabParamList,
  HomeStackParamList,
  SearchStackParamList,
  MapStackParamList,
  SavedStackParamList,
  ProfileStackParamList,
} from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import MapScreen from '../screens/MapScreen';
import SavedScreen from '../screens/SavedScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BusinessDetailScreen from '../screens/BusinessDetailScreen';
import BenefitDetailScreen from '../screens/BenefitDetailScreen';

const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const MapStack = createNativeStackNavigator<MapStackParamList>();
const SavedStack = createNativeStackNavigator<SavedStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
const Tab = createBottomTabNavigator<RootTabParamList>();

const screenOptions = { headerShown: false, animation: 'slide_from_right' } as const;

function HomeStackNav() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <HomeStack.Screen name="BenefitDetail" component={BenefitDetailScreen} />
    </HomeStack.Navigator>
  );
}

function SearchStackNav() {
  return (
    <SearchStack.Navigator screenOptions={screenOptions}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <SearchStack.Screen name="BenefitDetail" component={BenefitDetailScreen} />
    </SearchStack.Navigator>
  );
}

function MapStackNav() {
  return (
    <MapStack.Navigator screenOptions={screenOptions}>
      <MapStack.Screen name="Map" component={MapScreen} />
      <MapStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <MapStack.Screen name="BenefitDetail" component={BenefitDetailScreen} />
    </MapStack.Navigator>
  );
}

function SavedStackNav() {
  return (
    <SavedStack.Navigator screenOptions={screenOptions}>
      <SavedStack.Screen name="Saved" component={SavedScreen} />
      <SavedStack.Screen name="BusinessDetail" component={BusinessDetailScreen} />
      <SavedStack.Screen name="BenefitDetail" component={BenefitDetailScreen} />
    </SavedStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#6366F1',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#E8E6E1',
            height: Platform.OS === 'ios' ? 88 : 60,
            paddingBottom: Platform.OS === 'ios' ? 28 : 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },
          tabBarIcon: ({ focused, color, size }) => {
            const iconProps = { size: 22, color, strokeWidth: focused ? 2.5 : 2 };
            if (route.name === 'HomeTab') return <Home {...iconProps} />;
            if (route.name === 'SearchTab') return <Search {...iconProps} />;
            if (route.name === 'MapTab') return <Map {...iconProps} />;
            if (route.name === 'SavedTab') return <Bookmark {...iconProps} />;
            if (route.name === 'ProfileTab') return <User {...iconProps} />;
            return null;
          },
        })}
      >
        <Tab.Screen name="HomeTab" component={HomeStackNav} options={{ title: 'Inicio' }} />
        <Tab.Screen name="SearchTab" component={SearchStackNav} options={{ title: 'Buscar' }} />
        <Tab.Screen name="MapTab" component={MapStackNav} options={{ title: 'Mapa' }} />
        <Tab.Screen name="SavedTab" component={SavedStackNav} options={{ title: 'Guardados' }} />
        <Tab.Screen name="ProfileTab" component={ProfileStackNav} options={{ title: 'Perfil' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
