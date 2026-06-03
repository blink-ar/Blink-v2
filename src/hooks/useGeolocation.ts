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

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEYS = {
  position: 'userPosition',
  timestamp: 'userPositionTimestamp',
  permission: 'locationPermission',
} as const;

// Module-level listeners so all hook instances stay in sync when any one
// instance successfully obtains or loses location.
type LocationUpdate =
  | { type: 'position'; coordinates: Coordinates }
  | { type: 'denied' };

const locationListeners = new Set<(update: LocationUpdate) => void>();

const notifyListeners = (update: LocationUpdate) => {
  locationListeners.forEach((fn) => fn(update));
};

const getCachedPosition = (): Coordinates | null => {
  const cached = localStorage.getItem(STORAGE_KEYS.position);
  const timestamp = localStorage.getItem(STORAGE_KEYS.timestamp);
  if (!cached || !timestamp) return null;
  if (Date.now() - parseInt(timestamp) > CACHE_DURATION) return null;
  return JSON.parse(cached);
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    // Subscribe to updates from other instances (e.g. requestPermission called elsewhere)
    const handleUpdate = (update: LocationUpdate) => {
      if (update.type === 'position') {
        setState({ position: update.coordinates, error: null, loading: false, permissionDenied: false });
      } else {
        setState({ position: null, error: 'Permission denied', loading: false, permissionDenied: true });
      }
    };
    locationListeners.add(handleUpdate);
    return () => { locationListeners.delete(handleUpdate); };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionDenied: false,
      });
      return;
    }

    const cached = getCachedPosition();
    if (cached) {
      setState({ position: cached, error: null, loading: false, permissionDenied: false });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      const coordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(coordinates));
      localStorage.setItem(STORAGE_KEYS.timestamp, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.permission, 'granted');
      setState({ position: coordinates, error: null, loading: false, permissionDenied: false });
      notifyListeners({ type: 'position', coordinates });
    };

    const onError = (err: GeolocationPositionError) => {
      const isDenied = err.code === err.PERMISSION_DENIED;
      if (isDenied) {
        localStorage.setItem(STORAGE_KEYS.permission, 'denied');
        notifyListeners({ type: 'denied' });
      }
      setState({ position: null, error: err.message, loading: false, permissionDenied: isDenied });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: CACHE_DURATION,
    };

    const requestLocation = () =>
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          localStorage.setItem(STORAGE_KEYS.permission, 'denied');
          setState({ position: null, error: 'Permission denied', loading: false, permissionDenied: true });
        } else if (result.state === 'granted') {
          // Browser confirms the grant — fetch silently, no dialog will appear.
          requestLocation();
        } else {
          // 'prompt': the browser will show the native permission dialog if we call
          // getCurrentPosition(). On iOS this state can reappear after inactivity or
          // a Settings change even though the user already granted before.
          // If localStorage records a prior grant, skip the auto-request so we don't
          // annoy the user with a repeated dialog on every cold start; the dialog will
          // fire naturally when they explicitly tap the location button instead.
          const stored = localStorage.getItem(STORAGE_KEYS.permission);
          if (stored === 'granted') {
            setState({ position: null, error: null, loading: false, permissionDenied: false });
          } else {
            requestLocation();
          }
        }
      });
    } else {
      // Fallback for browsers without Permissions API (iOS < 16.4)
      const stored = localStorage.getItem(STORAGE_KEYS.permission);
      if (stored === 'denied') {
        setState({ position: null, error: 'Permission denied', loading: false, permissionDenied: true });
      } else {
        requestLocation();
      }
    }
  }, []);

  const requestPermission = () => {
    setState((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coordinates = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(coordinates));
        localStorage.setItem(STORAGE_KEYS.timestamp, Date.now().toString());
        localStorage.setItem(STORAGE_KEYS.permission, 'granted');
        setState({ position: coordinates, error: null, loading: false, permissionDenied: false });
        notifyListeners({ type: 'position', coordinates });
      },
      (err) => {
        const isDenied = err.code === err.PERMISSION_DENIED;
        if (isDenied) {
          localStorage.setItem(STORAGE_KEYS.permission, 'denied');
          notifyListeners({ type: 'denied' });
        }
        setState({ position: null, error: err.message, loading: false, permissionDenied: isDenied });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return {
    ...state,
    requestPermission,
  };
};
