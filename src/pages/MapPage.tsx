import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getGoogleMaps } from '../services/googleMapsLoader';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBenefitsData } from '../hooks/useBenefitsData';
import { Business, CanonicalLocation } from '../types';

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires
const DEFAULT_ZOOM = 13;

const MAP_STYLE = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e9f2fe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f9fa' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#74787c' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

interface MarkerData {
  business: Business;
  location: CanonicalLocation;
}

function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusBusinessId = searchParams.get('business');

  const { position } = useGeolocation();
  const { businesses, isLoading } = useBenefitsData();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  // Get max discount for a business
  const getMaxDiscount = (biz: Business) => {
    let max = 0;
    biz.benefits.forEach((b) => {
      const m = b.rewardRate.match(/(\d+)%/);
      if (m) max = Math.max(max, parseInt(m[1]));
    });
    return max;
  };

  const getBestBenefitText = (biz: Business) => {
    const max = getMaxDiscount(biz);
    if (max > 0) return `HASTA ${max}% OFF`;
    const withInstallments = biz.benefits.find((b) => b.installments && b.installments > 0);
    if (withInstallments) return `${withInstallments.installments} CUOTAS S/INT`;
    return `${biz.benefits.length} BENEFICIOS`;
  };

  // Build flat list of marker data from businesses
  const markerDataList: MarkerData[] = [];
  businesses.forEach((biz) => {
    biz.location.forEach((loc) => {
      if (loc.lat !== 0 || loc.lng !== 0) {
        markerDataList.push({ business: biz, location: loc });
      }
    });
  });

  const createMarkerIcon = (googleMaps: any, isSelected: boolean) => {
    const pinSize = isSelected ? 40 : 28;
    const pinColor = isSelected ? '#1a1a1a' : '#6366f1';
    return {
      url:
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(`
          <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
                <feOffset dx="0" dy="1.5" result="offsetblur"/>
                <feComponentTransfer><feFuncA type="linear" slope="0.3"/></feComponentTransfer>
                <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <g filter="url(#shadow)">
              <circle cx="24" cy="24" r="${isSelected ? 16 : 12}" fill="${pinColor}" stroke="#ffffff" stroke-width="2.5"/>
              <circle cx="24" cy="24" r="${isSelected ? 6 : 4.5}" fill="#ffffff"/>
            </g>
          </svg>
        `),
      scaledSize: new googleMaps.maps.Size(pinSize, pinSize),
      anchor: new googleMaps.maps.Point(pinSize / 2, pinSize / 2),
    };
  };

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      const googleMaps = (await getGoogleMaps()) as any;
      if (!mapContainerRef.current) return;

      const center = position
        ? { lat: position.latitude, lng: position.longitude }
        : DEFAULT_CENTER;

      if (!mapRef.current) {
        mapRef.current = new googleMaps.maps.Map(mapContainerRef.current, {
          center,
          zoom: DEFAULT_ZOOM,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: false,
          clickableIcons: false,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          styles: MAP_STYLE,
        });

        // Deselect when clicking the map background
        mapRef.current.addListener('click', () => {
          setSelectedBusiness(null);
        });
      }

      // Clear old markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      const bounds = new googleMaps.maps.LatLngBounds();
      let hasBounds = false;

      markerDataList.forEach(({ business: biz, location: loc }) => {
        const isFocused = focusBusinessId === biz.id;
        const marker = new googleMaps.maps.Marker({
          position: { lat: loc.lat, lng: loc.lng },
          map: mapRef.current,
          title: biz.name,
          icon: createMarkerIcon(googleMaps, isFocused),
          optimized: true,
          zIndex: isFocused ? 1000 : 1,
        });

        marker.addListener('click', () => {
          setSelectedBusiness(biz);
          mapRef.current.panTo({ lat: loc.lat, lng: loc.lng });
        });

        // Store reference for re-styling on selection
        (marker as any).__businessId = biz.id;
        (marker as any).__googleMaps = googleMaps;
        markersRef.current.push(marker);

        bounds.extend({ lat: loc.lat, lng: loc.lng });
        hasBounds = true;
      });

      // Fit to focused business or all bounds
      if (focusBusinessId) {
        const focusMarkers = markerDataList.filter((d) => d.business.id === focusBusinessId);
        if (focusMarkers.length > 0) {
          const focusBounds = new googleMaps.maps.LatLngBounds();
          focusMarkers.forEach((d) => focusBounds.extend({ lat: d.location.lat, lng: d.location.lng }));
          if (focusMarkers.length === 1) {
            mapRef.current.setCenter({ lat: focusMarkers[0].location.lat, lng: focusMarkers[0].location.lng });
            mapRef.current.setZoom(15);
          } else {
            mapRef.current.fitBounds(focusBounds);
          }
          setSelectedBusiness(focusMarkers[0].business);
        } else if (hasBounds) {
          mapRef.current.fitBounds(bounds);
        }
      } else if (hasBounds) {
        mapRef.current.fitBounds(bounds);
      }

      setMapError(null);
    } catch (err: any) {
      console.error('Map init failed', err);
      setMapError(err.message || 'No se pudo cargar el mapa');
    }
  }, [position, markerDataList.length, focusBusinessId]);

  // Update marker styles when selection changes
  useEffect(() => {
    markersRef.current.forEach((marker) => {
      const gm = (marker as any).__googleMaps;
      const isSelected = selectedBusiness && (marker as any).__businessId === selectedBusiness.id;
      if (gm) {
        marker.setIcon(createMarkerIcon(gm, !!isSelected));
        marker.setZIndex(isSelected ? 1000 : 1);
      }
    });
  }, [selectedBusiness]);

  useEffect(() => {
    if (!isLoading && businesses.length > 0) {
      initMap();
    }
  }, [isLoading, businesses.length, initMap]);

  return (
    <div className="bg-blink-bg text-blink-ink font-body h-screen flex flex-col overflow-hidden max-w-md mx-auto border-x-2 border-blink-ink relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 px-4 pt-4 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center w-10 h-10 bg-white border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
        <div className="bg-white border-2 border-blink-ink shadow-hard px-4 py-2">
          <span className="font-display text-sm tracking-tighter uppercase">
            {markerDataList.length} UBICACIONES
          </span>
        </div>
      </header>

      {/* Map */}
      <div ref={mapContainerRef} className="flex-1 w-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-blink-ink border-t-primary animate-spin" />
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-x-0 top-20 mx-4 z-20 bg-white border-2 border-blink-ink shadow-hard p-4">
          <p className="font-mono text-sm text-center">{mapError}</p>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute right-4 bottom-28 z-20 flex flex-col gap-2">
        <button
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || DEFAULT_ZOOM) + 1)}
          className="w-10 h-10 bg-white border-2 border-blink-ink shadow-hard flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
        </button>
        <button
          onClick={() => mapRef.current?.setZoom((mapRef.current.getZoom() || DEFAULT_ZOOM) - 1)}
          className="w-10 h-10 bg-white border-2 border-blink-ink shadow-hard flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>remove</span>
        </button>
        {position && (
          <button
            onClick={() => {
              mapRef.current?.panTo({ lat: position.latitude, lng: position.longitude });
              mapRef.current?.setZoom(15);
            }}
            className="w-10 h-10 bg-white border-2 border-blink-ink shadow-hard flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>my_location</span>
          </button>
        )}
      </div>

      {/* Selected business card */}
      {selectedBusiness && (
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <div
            onClick={() => navigate(`/business/${selectedBusiness.id}`, { state: { business: selectedBusiness } })}
            className="bg-white border-2 border-blink-ink shadow-hard flex items-center gap-4 p-4 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            {/* Logo */}
            <div className="w-16 h-16 shrink-0 border-2 border-blink-ink bg-white flex items-center justify-center p-1 overflow-hidden">
              {selectedBusiness.image ? (
                <img
                  alt={selectedBusiness.name}
                  className="w-full h-full object-contain grayscale"
                  src={selectedBusiness.image}
                />
              ) : (
                <span className="font-display text-xl text-blink-muted">
                  {selectedBusiness.name?.charAt(0)}
                </span>
              )}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base uppercase leading-tight tracking-tight truncate">
                {selectedBusiness.name}
              </h3>
              <div className="bg-blink-ink text-primary p-1 w-fit border border-primary mt-1">
                <span className="font-display text-sm leading-none block">
                  {getBestBenefitText(selectedBusiness)}
                </span>
              </div>
              <p className="font-mono text-[10px] text-blink-muted mt-1 truncate">
                {selectedBusiness.location.length} {selectedBusiness.location.length === 1 ? 'sucursal' : 'sucursales'}
              </p>
            </div>
            <span className="material-symbols-outlined text-blink-ink text-2xl shrink-0">chevron_right</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapPage;
