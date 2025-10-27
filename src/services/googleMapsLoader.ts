// Google Maps type definitions
interface GoogleMap {
  setCenter(latLng: { lat: number; lng: number }): void;
  setZoom(zoom: number): void;
  fitBounds(bounds: GoogleLatLngBounds): void;
}

interface GoogleMarker {
  setMap(map: GoogleMap | null): void;
  getPosition(): { lat: number; lng: number } | null;
  getTitle(): string | null;
  addListener(event: string, handler: () => void): void;
}

interface GoogleInfoWindow {
  setContent(content: string): void;
  open(options: { anchor: GoogleMarker; map: GoogleMap }): void;
}

interface GoogleLatLngBounds {
  extend(latLng: { lat: number; lng: number }): void;
}

interface GoogleMapsAPI {
  maps: {
    Map: new (element: HTMLElement, options: {
      center: { lat: number; lng: number };
      zoom: number;
      mapTypeControl?: boolean;
      fullscreenControl?: boolean;
      streetViewControl?: boolean;
    }) => GoogleMap;
    Marker: new (options: {
      position: { lat: number; lng: number };
      map: GoogleMap;
      title?: string;
    }) => GoogleMarker;
    InfoWindow: new () => GoogleInfoWindow;
    LatLngBounds: new () => GoogleLatLngBounds;
  };
}

declare global {
  interface Window {
    google: GoogleMapsAPI;
    __googleMapsInit?: () => void;
  }
}

const getEnvApiKey = (): string | undefined => {
  // In Vite, environment variables are available through import.meta.env
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('Google Maps API Key loaded:', apiKey ? 'Present' : 'Missing');
  return apiKey;
};

let loadPromise: Promise<GoogleMapsAPI> | null = null;

const appendScript = (apiKey: string): Promise<GoogleMapsAPI> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Maps API is only available in the browser context.'));
      return;
    }

    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-maps-loader="true"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar Google Maps.')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__googleMapsInit`;
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';

    window.__googleMapsInit = () => {
      resolve(window.google);
      delete window.__googleMapsInit;
    };

    script.onerror = () => {
      delete window.__googleMapsInit;
      reject(new Error('No se pudo cargar Google Maps.'));
    };

    document.head.appendChild(script);
  });
};

export const getGoogleMaps = async (): Promise<GoogleMapsAPI> => {
  if (typeof window === 'undefined') {
    throw new Error('Google Maps API is only available in the navegador.');
  }

  if (window.google && window.google.maps) {
    return window.google;
  }

  if (loadPromise) {
    return loadPromise;
  }

  const apiKey = getEnvApiKey();
  if (!apiKey) {
    throw new Error('Missing Google Maps API key. Define VITE_GOOGLE_MAPS_API_KEY.');
  }

  loadPromise = appendScript(apiKey);
  return loadPromise;
};
