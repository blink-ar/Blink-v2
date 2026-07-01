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

const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: CACHE_DURATION,
};

// Module-level listeners so all hook instances stay in sync. Any instance that
// starts/finishes a location request broadcasts here, so siblings (e.g. the
// separate useGeolocation() inside useBenefitsData) reflect the same state.
type LocationUpdate =
  | { type: 'position'; coordinates: Coordinates }
  | { type: 'denied' }
  | { type: 'pending' }
  | { type: 'error'; message: string };

const locationListeners = new Set<(update: LocationUpdate) => void>();

const notifyListeners = (update: LocationUpdate) => {
  locationListeners.forEach((fn) => fn(update));
};

// Shared across all hook instances: true while a browser geolocation request is
// pending (or imminent). Lets sibling instances avoid idling out (loading:false)
// mid-request.
let requestInFlight = false;

// Shared across all hook instances: true while a getCurrentPosition() call is
// actually outstanding. Used to dedupe concurrent requests so only one runs at a
// time — otherwise a slow duplicate's later timeout/error could overwrite a
// position that another request already obtained.
let requestDispatched = false;

const getCachedPosition = (): Coordinates | null => {
  const cached = localStorage.getItem(STORAGE_KEYS.position);
  const timestamp = localStorage.getItem(STORAGE_KEYS.timestamp);
  if (!cached || !timestamp) return null;
  if (Date.now() - parseInt(timestamp) > CACHE_DURATION) return null;
  return JSON.parse(cached);
};

// Marks the permission as denied and broadcasts it to every instance.
const resolveDenied = () => {
  requestInFlight = false;
  localStorage.setItem(STORAGE_KEYS.permission, 'denied');
  notifyListeners({ type: 'denied' });
};

// Starts a browser geolocation request, broadcasting the pending state up front
// and the outcome (position / denied / error) to every instance when it settles.
const runRequest = () => {
  requestInFlight = true;
  notifyListeners({ type: 'pending' });

  // Dedupe: if a request is already outstanding (e.g. started by another
  // useGeolocation instance entering the granted branch), don't fire a second
  // getCurrentPosition. The single in-flight request broadcasts its outcome to
  // every instance, so a slow duplicate can't later overwrite a position that
  // another request already obtained.
  if (requestDispatched) return;
  requestDispatched = true;

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coordinates = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };
      localStorage.setItem(STORAGE_KEYS.position, JSON.stringify(coordinates));
      localStorage.setItem(STORAGE_KEYS.timestamp, Date.now().toString());
      localStorage.setItem(STORAGE_KEYS.permission, 'granted');
      requestDispatched = false;
      requestInFlight = false;
      notifyListeners({ type: 'position', coordinates });
    },
    (err) => {
      requestDispatched = false;
      requestInFlight = false;
      if (err.code === err.PERMISSION_DENIED) {
        resolveDenied();
      } else {
        notifyListeners({ type: 'error', message: err.message });
      }
    },
    POSITION_OPTIONS,
  );
};

interface UseGeolocationOptions {
  /**
   * When true, actively prompts the user for location on mount if permission
   * hasn't been decided yet ('prompt' state). When false (default), we never
   * trigger the browser permission prompt automatically — we only reuse a
   * previously granted permission silently. The actual prompt is then deferred
   * to an explicit user gesture via `requestPermission()` (e.g. the "Cerca"
   * pill in search). This avoids the invasive "ask on first load" pattern.
   */
  autoRequest?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const { autoRequest = false } = options;
  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  useEffect(() => {
    // Subscribe to updates from any instance (its own requests included).
    const handleUpdate = (update: LocationUpdate) => {
      switch (update.type) {
        case 'position':
          setState({ position: update.coordinates, error: null, loading: false, permissionDenied: false });
          break;
        case 'denied':
          setState({ position: null, error: 'Permission denied', loading: false, permissionDenied: true });
          break;
        case 'pending':
          // A request started somewhere — reflect loading without dropping a
          // position we may already have.
          setState((prev) => ({ ...prev, error: null, loading: true, permissionDenied: false }));
          break;
        case 'error':
          setState({ position: null, error: update.message, loading: false, permissionDenied: false });
          break;
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

    // Idle state used when we intentionally don't request location (no prompt,
    // no error, not denied) — consumers see position=null and can offer a gesture.
    // Skip if a request is already in flight (possibly from a sibling instance)
    // so we don't report positionLoading=false while a prompt/GPS call is pending.
    const setIdle = () => {
      if (requestInFlight) return;
      setState({ position: null, error: null, loading: false, permissionDenied: false });
    };

    // If this instance will actively request on mount, mark in-flight
    // synchronously (before the async permission check) so sibling instances
    // mounting alongside us don't idle out before the request actually starts.
    if (autoRequest) requestInFlight = true;

    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          resolveDenied();
        } else if (result.state === 'granted') {
          // Already granted in a previous session: reuse it silently. Querying
          // permission state never shows a prompt, and getCurrentPosition won't
          // either once granted, so this is safe and non-invasive.
          runRequest();
        } else {
          // 'prompt': permission undecided. Only ask if the caller explicitly
          // opted in (autoRequest). Otherwise stay idle until a user gesture.
          if (autoRequest) runRequest();
          else setIdle();
        }
      });
    } else {
      // Fallback for browsers without the Permissions API: we can't read the
      // real permission state, so we must not silently call getCurrentPosition
      // (a stale localStorage 'granted' could still trigger a prompt). Only
      // request when the caller explicitly opted in.
      const stored = localStorage.getItem(STORAGE_KEYS.permission);
      if (stored === 'denied') {
        resolveDenied();
      } else if (autoRequest) {
        runRequest();
      } else {
        setIdle();
      }
    }
  }, [autoRequest]);

  const requestPermission = () => {
    if (!navigator.geolocation) {
      setState({
        position: null,
        error: 'Geolocation is not supported by your browser',
        loading: false,
        permissionDenied: false,
      });
      return;
    }

    runRequest();
  };

  return {
    ...state,
    requestPermission,
  };
};
