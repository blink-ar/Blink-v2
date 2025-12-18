import { useState, useEffect } from 'react';

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

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionDenied: false,
      });
      return;
    }

    // Try to get cached position from localStorage
    const cachedPosition = localStorage.getItem('userPosition');
    const cacheTimestamp = localStorage.getItem('userPositionTimestamp');

    if (cachedPosition && cacheTimestamp) {
      const cacheAge = Date.now() - parseInt(cacheTimestamp);
      const fiveMinutes = 5 * 60 * 1000;

      // Use cached position if less than 5 minutes old
      if (cacheAge < fiveMinutes) {
        setState({
          position: JSON.parse(cachedPosition),
          error: null,
          loading: false,
          permissionDenied: false,
        });
        return;
      }
    }

    // Request current position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        // Cache the position
        localStorage.setItem('userPosition', JSON.stringify(coordinates));
        localStorage.setItem('userPositionTimestamp', Date.now().toString());

        setState({
          position: coordinates,
          error: null,
          loading: false,
          permissionDenied: false,
        });
      },
      (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED;
        setState({
          position: null,
          error: err.message,
          loading: false,
          permissionDenied: isDenied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Accept positions up to 5 minutes old
      }
    );
  }, []);

  const requestPermission = () => {
    setState((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };

        localStorage.setItem('userPosition', JSON.stringify(coordinates));
        localStorage.setItem('userPositionTimestamp', Date.now().toString());

        setState({
          position: coordinates,
          error: null,
          loading: false,
          permissionDenied: false,
        });
      },
      (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED;
        setState({
          position: null,
          error: err.message,
          loading: false,
          permissionDenied: isDenied,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  return {
    ...state,
    requestPermission,
  };
};
