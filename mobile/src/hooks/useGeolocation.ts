import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  position: Coordinates | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

const POSITION_CACHE_KEY = 'userPosition';
const POSITION_TIMESTAMP_KEY = 'userPositionTimestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    let isMounted = true;

    const getLocation = async () => {
      try {
        // Check cached position
        const cachedPosition = await AsyncStorage.getItem(POSITION_CACHE_KEY);
        const cacheTimestamp = await AsyncStorage.getItem(POSITION_TIMESTAMP_KEY);

        if (cachedPosition && cacheTimestamp) {
          const cacheAge = Date.now() - parseInt(cacheTimestamp);
          if (cacheAge < CACHE_DURATION) {
            if (isMounted) {
              setState({
                position: JSON.parse(cachedPosition),
                error: null,
                loading: false,
                permissionDenied: false,
              });
            }
            return;
          }
        }

        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (isMounted) {
            setState({
              position: null,
              error: 'Permission to access location was denied',
              loading: false,
              permissionDenied: true,
            });
          }
          return;
        }

        // Get current position
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coordinates: Coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        // Cache position
        await AsyncStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(coordinates));
        await AsyncStorage.setItem(POSITION_TIMESTAMP_KEY, Date.now().toString());

        if (isMounted) {
          setState({
            position: coordinates,
            error: null,
            loading: false,
            permissionDenied: false,
          });
        }
      } catch (err: any) {
        if (isMounted) {
          setState({
            position: null,
            error: err.message || 'Failed to get location',
            loading: false,
            permissionDenied: false,
          });
        }
      }
    };

    getLocation();

    return () => {
      isMounted = false;
    };
  }, []);

  const requestPermission = async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setState({
          position: null,
          error: 'Permission denied',
          loading: false,
          permissionDenied: true,
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coordinates: Coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      await AsyncStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(coordinates));
      await AsyncStorage.setItem(POSITION_TIMESTAMP_KEY, Date.now().toString());

      setState({
        position: coordinates,
        error: null,
        loading: false,
        permissionDenied: false,
      });
    } catch (err: any) {
      setState({
        position: null,
        error: err.message || 'Failed to get location',
        loading: false,
        permissionDenied: false,
      });
    }
  };

  return { ...state, requestPermission };
};
