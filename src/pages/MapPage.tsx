import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getGoogleMaps } from '../services/googleMapsLoader';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBenefitsData, BenefitsFilters } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { Business } from '../types';
import BottomNav from '../components/neo/BottomNav';
import FilterPanel from '../components/neo/FilterPanel';

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

// ~5km in degrees (used to create a 10km-wide bounding box)
const KM5_IN_LAT = 0.045;
const km5InLng = (lat: number) => 0.045 / Math.cos((lat * Math.PI) / 180);

const MAP_STYLE = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#e9f2fe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f8f9fa' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e8f5e9' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const CATEGORY_CHIPS = [
  { id: 'nearby', label: 'Cerca de mí' },
  { id: 'moda', label: 'Indumentaria' },
  { id: 'gastronomia', label: 'Gastronomía' },
  { id: 'hogar', label: 'Hogar' },
  { id: 'deportes', label: 'Deportes' },
  { id: 'belleza', label: 'Belleza' },
  { id: 'electro', label: 'Electro' },
];

// One entry per location (a business with N branches = N markers)
interface MapMarker {
  business: Business;
  lat: number;
  lng: number;
  address: string;
}


function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusBusinessId = searchParams.get('business');

  const { position } = useGeolocation();

  // Search & filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeChip, setActiveChip] = useState('nearby');
  const [showFilters, setShowFilters] = useState(false);

  // Filter panel state
  const [minDiscount, setMinDiscount] = useState<number | undefined>();
  const [maxDistance, setMaxDistance] = useState<number | undefined>();
  const [availableDay, setAvailableDay] = useState<string | undefined>();
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>();
  const [network, setNetwork] = useState<string | undefined>();
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>();
  const [onlineOnly, setOnlineOnly] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const filters: BenefitsFilters = useMemo(() => ({
    search: debouncedSearch.trim() || undefined,
    category: activeChip !== 'nearby' ? activeChip : undefined,
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
  }), [debouncedSearch, activeChip, minDiscount, maxDistance, availableDay, network, cardMode, hasInstallments]);

  const { businesses: rawBusinesses, isLoading, totalBusinesses } = useBenefitsData(filters);

  // Apply client-side filters (discount, distance, day, network, card mode, installments, online)
  const businesses = useEnrichedBusinesses(rawBusinesses, {
    onlineOnly,
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
  });

  // Map refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);
  const googleRef = useRef<any>(null);

  // UI state
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedMarkerIdx, setSelectedMarkerIdx] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  // Single-business mode: when coming from a business/benefit detail page
  const isSingleBusinessMode = !!focusBusinessId;

  // Find the focused business from loaded data
  const focusedBusiness = useMemo(() => {
    if (!focusBusinessId) return null;
    return businesses.find((b) => b.id === focusBusinessId) || null;
  }, [focusBusinessId, businesses]);

  // ALL markers: one entry per valid location across all businesses, sorted by distance
  const mapMarkers: MapMarker[] = useMemo(() => {
    const source = isSingleBusinessMode && focusedBusiness
      ? [focusedBusiness]
      : businesses;

    const markers: MapMarker[] = [];
    source.forEach((biz) => {
      biz.location.forEach((loc) => {
        if (loc.lat !== 0 || loc.lng !== 0) {
          markers.push({
            business: biz,
            lat: loc.lat,
            lng: loc.lng,
            address: loc.formattedAddress || loc.name || '',
          });
        }
      });
    });

    // Sort by distance to user location (closest first)
    if (position) {
      const userLat = position.latitude;
      const userLng = position.longitude;
      markers.sort((a, b) => {
        const dA = (a.lat - userLat) ** 2 + (a.lng - userLng) ** 2;
        const dB = (b.lat - userLat) ** 2 + (b.lng - userLng) ** 2;
        return dA - dB;
      });
    }

    return markers;
  }, [businesses, isSingleBusinessMode, focusedBusiness, position]);


  // Helpers
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

  const getBestBankName = (biz: Business) => {
    if (!biz.benefits.length) return '';
    return biz.benefits[0].bankName?.replace(/banco\s*/i, '').substring(0, 8) || '';
  };

  const getShortBenefitForTooltip = (biz: Business) => {
    const max = getMaxDiscount(biz);
    const bank = getBestBankName(biz);
    if (max > 0) return `${max}% OFF${bank ? ` - ${bank}` : ''}`;
    const withInstallments = biz.benefits.find((b) => b.installments && b.installments > 0);
    if (withInstallments) return `${withInstallments.installments} cuotas${bank ? ` - ${bank}` : ''}`;
    return bank || 'Ver beneficios';
  };

  // ─── Create / clear custom overlays ────────────────────────────

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
  }, []);

  const buildOverlays = useCallback((google: any, map: any, selected: Business | null) => {
    clearOverlays();

    // Factory for OverlayView subclass
    class BusinessOverlay extends google.maps.OverlayView {
      private pos: any;
      private div: HTMLDivElement | null = null;
      private biz: Business;
      private isSelected: boolean;
      private imgSrc: string;
      private onSelect: () => void;

      constructor(pos: any, biz: Business, isSelected: boolean, imgSrc: string, onSelect: () => void) {
        super();
        this.pos = pos;
        this.biz = biz;
        this.isSelected = isSelected;
        this.imgSrc = imgSrc;
        this.onSelect = onSelect;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.cursor = 'pointer';
        this.div.style.zIndex = this.isSelected ? '100' : '10';
        this.div.addEventListener('click', (e) => {
          e.stopPropagation();
          this.onSelect();
        });
        this.render();
        const panes = this.getPanes();
        panes.overlayMouseTarget.appendChild(this.div);
      }

      render() {
        if (!this.div) return;
        const size = this.isSelected ? 48 : 40;
        const imgSize = this.isSelected ? 32 : 24;

        let html = '';

        // Tooltip for selected
        if (this.isSelected) {
          const benefitText = getShortBenefitForTooltip(this.biz);
          html += `
            <div style="position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:10px;white-space:nowrap;
              background:#0F0F0F;border:2px solid #0F0F0F;box-shadow:4px 4px 0px 0px #0F0F0F;padding:6px 10px;
              display:flex;flex-direction:column;align-items:center;z-index:200;pointer-events:none;">
              <span style="color:#00F0FF;font-family:'Archivo Black',sans-serif;font-size:11px;text-transform:uppercase;line-height:1.2;">${this.biz.name}</span>
              <span style="color:#fff;font-family:'JetBrains Mono',monospace;font-size:10px;margin-top:2px;">${benefitText}</span>
              <div style="position:absolute;bottom:-6px;left:50%;transform:translateX(-50%) rotate(45deg);width:10px;height:10px;background:#0F0F0F;"></div>
            </div>`;
        }

        // Marker circle
        const bg = this.isSelected ? '#00F0FF' : '#FFFFFF';
        const ring = this.isSelected ? 'box-shadow:4px 4px 0px 0px #0F0F0F, 0 0 0 4px rgba(0,240,255,0.3);' : 'box-shadow:2px 2px 0px 0px #0F0F0F;';
        const grayscale = this.isSelected ? '' : 'filter:grayscale(100%);';

        html += `
          <div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:2px solid #0F0F0F;
            ${ring}display:flex;align-items:center;justify-content:center;position:relative;z-index:20;
            transition:transform 0.15s;">
            ${this.imgSrc
              ? `<img src="${this.imgSrc}" alt="" style="width:${imgSize}px;height:${imgSize}px;object-fit:contain;${grayscale}" />`
              : `<span style="font-family:'Archivo Black',sans-serif;font-size:${this.isSelected ? 18 : 14}px;color:#0F0F0F;">${this.biz.name?.charAt(0) || '?'}</span>`
            }
          </div>`;

        // Shadow dot
        html += `<div style="width:16px;height:6px;background:rgba(15,15,15,0.2);border-radius:50%;margin:2px auto 0;filter:blur(1px);"></div>`;

        this.div.innerHTML = html;
      }

      draw() {
        if (!this.div) return;
        const proj = this.getProjection();
        if (!proj) return;
        const px = proj.fromLatLngToDivPixel(this.pos);
        if (px) {
          const size = this.isSelected ? 48 : 40;
          this.div.style.left = (px.x - size / 2) + 'px';
          this.div.style.top = (px.y - size - 4) + 'px'; // anchor at bottom
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }

      updateSelection(isSelected: boolean) {
        this.isSelected = isSelected;
        if (this.div) {
          this.div.style.zIndex = isSelected ? '100' : '10';
        }
        this.render();
        this.draw();
      }
    }

    // Create overlays — one per location
    mapMarkers.forEach(({ business: biz, lat, lng }, idx) => {
      const isSelected = isSingleBusinessMode
        ? selected?.id === biz.id && idx === 0
        : selected?.id === biz.id;
      const pos = new google.maps.LatLng(lat, lng);
      const overlay = new BusinessOverlay(pos, biz, isSelected, biz.image || '', () => {
        setSelectedBusiness(biz);
        setSelectedMarkerIdx(idx);
        map.panTo(pos);
      });
      overlay.setMap(map);
      (overlay as any).__businessId = biz.id;
      (overlay as any).__markerIdx = idx;
      overlaysRef.current.push(overlay);
    });
  }, [mapMarkers, clearOverlays, isSingleBusinessMode]);

  // ─── User location overlay ─────────────────────────────────────

  const createUserLocationOverlay = useCallback((google: any, map: any, lat: number, lng: number) => {
    if (userOverlayRef.current) {
      userOverlayRef.current.setMap(null);
    }

    class UserLocationOverlay extends google.maps.OverlayView {
      private pos: any;
      private div: HTMLDivElement | null = null;

      constructor(pos: any) {
        super();
        this.pos = pos;
      }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.zIndex = '5';
        this.div.style.pointerEvents = 'none';
        this.div.innerHTML = `
          <div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;inset:0;background:rgba(255,51,102,0.2);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;inset:3px;background:#FF3366;border:2px solid #0F0F0F;border-radius:50%;box-shadow:2px 2px 0px 0px #0F0F0F;"></div>
          </div>
        `;
        this.getPanes().overlayLayer.appendChild(this.div);
      }

      draw() {
        if (!this.div) return;
        const proj = this.getProjection();
        if (!proj) return;
        const px = proj.fromLatLngToDivPixel(this.pos);
        if (px) {
          this.div.style.left = (px.x - 12) + 'px';
          this.div.style.top = (px.y - 12) + 'px';
        }
      }

      onRemove() {
        if (this.div && this.div.parentNode) {
          this.div.parentNode.removeChild(this.div);
          this.div = null;
        }
      }
    }

    const overlay = new UserLocationOverlay(new google.maps.LatLng(lat, lng));
    overlay.setMap(map);
    userOverlayRef.current = overlay;
  }, []);

  // ─── Map init ──────────────────────────────────────────────────

  const initMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      const google = (await getGoogleMaps()) as any;
      if (!mapContainerRef.current) return;
      googleRef.current = google;

      const center = position
        ? { lat: position.latitude, lng: position.longitude }
        : DEFAULT_CENTER;

      if (!mapRef.current) {
        mapRef.current = new google.maps.Map(mapContainerRef.current, {
          center,
          zoom: 15,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          zoomControl: false,
          clickableIcons: false,
          disableDefaultUI: true,
          gestureHandling: 'greedy',
          styles: MAP_STYLE,
        });

        mapRef.current.addListener('click', () => {
          setSelectedBusiness(null);
        });
      }

      // User location dot
      if (position) {
        createUserLocationOverlay(google, mapRef.current, position.latitude, position.longitude);
      }

      // Build business overlays
      buildOverlays(google, mapRef.current, selectedBusiness);

      // Fit bounds
      if (isSingleBusinessMode) {
        // Single-business mode: fit all of that business's locations
        if (mapMarkers.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          mapMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
          if (mapMarkers.length === 1) {
            mapRef.current.setCenter({ lat: mapMarkers[0].lat, lng: mapMarkers[0].lng });
            mapRef.current.setZoom(16);
          } else {
            mapRef.current.fitBounds(bounds);
          }
          // Auto-select the first location (closest to user) by default
          if (focusedBusiness) {
            setSelectedBusiness(focusedBusiness);
            setSelectedMarkerIdx(0);
            mapRef.current.panTo({ lat: mapMarkers[0].lat, lng: mapMarkers[0].lng });
          }
        }
      } else if (position) {
        // Browse mode with user location: 2km-wide view centered on user
        const lat = position.latitude;
        const lng = position.longitude;
        const lngOff = km5InLng(lat);
        const bounds = new google.maps.LatLngBounds(
          { lat: lat - KM5_IN_LAT, lng: lng - lngOff },
          { lat: lat + KM5_IN_LAT, lng: lng + lngOff },
        );
        mapRef.current.fitBounds(bounds);
      }

      setMapError(null);
    } catch (err: any) {
      console.error('Map init failed', err);
      setMapError(err.message || 'No se pudo cargar el mapa');
    }
  }, [position, mapMarkers, isSingleBusinessMode, focusedBusiness, buildOverlays, createUserLocationOverlay]);

  // Init map when data is ready
  useEffect(() => {
    if (!isLoading && rawBusinesses.length > 0) {
      initMap();
    }
  }, [isLoading, rawBusinesses.length, initMap]);

  // Update overlays when selection changes (without reinitializing map)
  useEffect(() => {
    overlaysRef.current.forEach((o: any) => {
      if (typeof o.updateSelection === 'function') {
        const isSelected = isSingleBusinessMode
          ? selectedBusiness?.id === o.__businessId && selectedMarkerIdx === o.__markerIdx
          : selectedBusiness?.id === o.__businessId;
        o.updateSelection(isSelected);
      }
    });
  }, [selectedBusiness, selectedMarkerIdx, isSingleBusinessMode]);

  // Scroll bottom sheet to selected business/marker
  useEffect(() => {
    if (selectedBusiness && listRef.current) {
      let el;
      if (isSingleBusinessMode && selectedMarkerIdx !== null) {
        el = listRef.current.querySelector(`[data-marker-idx="${selectedMarkerIdx}"]`);
      } else {
        el = listRef.current.querySelector(`[data-biz-id="${selectedBusiness.id}"]`);
      }
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [selectedBusiness, selectedMarkerIdx, isSingleBusinessMode]);

  // Select business from list & pan map to its first location
  const handleSelectFromList = (biz: Business) => {
    setSelectedBusiness(biz);
    const target = mapMarkers.find((m) => m.business.id === biz.id);
    if (target && mapRef.current) {
      mapRef.current.panTo({ lat: target.lat, lng: target.lng });
      if ((mapRef.current.getZoom() || 0) < 15) mapRef.current.setZoom(15);
    }
  };

  return (
    <div className="bg-blink-bg text-blink-ink font-body h-[100dvh] flex flex-col overflow-hidden relative">
      {/* ─── Floating Header ─── */}
      <header className="absolute top-0 left-0 w-full z-30 p-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-12 h-12 bg-white border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>arrow_back</span>
          </button>

          {isSingleBusinessMode ? (
            /* Single business mode: show business name + location count */
            <div className="flex-1 h-12 border-2 border-blink-ink bg-white shadow-hard flex items-center px-3 gap-2 min-w-0">
              <span className="font-display uppercase tracking-tight text-blink-ink text-sm truncate">
                {focusedBusiness?.name || 'Cargando...'}
              </span>
              <span className="font-mono text-[10px] font-bold bg-primary px-2 py-0.5 border border-blink-ink whitespace-nowrap shrink-0">
                {mapMarkers.length} {mapMarkers.length === 1 ? 'SUCURSAL' : 'SUCURSALES'}
              </span>
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="flex-1 h-12 relative">
                <input
                  className="w-full h-full border-2 border-blink-ink bg-white px-3 font-display uppercase tracking-tight text-blink-ink placeholder-gray-400 focus:outline-none focus:ring-0 shadow-hard text-sm"
                  placeholder="BUSCAR TIENDAS..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="absolute right-0 top-0 h-full w-12 flex items-center justify-center bg-blink-ink border-l-2 border-blink-ink">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>search</span>
                </button>
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center w-12 h-12 bg-blink-warning border-2 border-blink-ink shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all shrink-0"
              >
                <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 24 }}>tune</span>
              </button>
            </>
          )}
        </div>

        {/* Category chips — only in browse mode */}
        {!isSingleBusinessMode && (
          <div className="pointer-events-auto w-full overflow-x-auto no-scrollbar mt-3">
            <div className="flex gap-2 min-w-max pb-1">
              {CATEGORY_CHIPS.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setActiveChip(chip.id)}
                  className={`px-3 py-1.5 border-2 border-blink-ink font-bold uppercase text-xs shadow-hard-sm whitespace-nowrap transition-colors ${
                    activeChip === chip.id
                      ? 'bg-blink-ink text-primary'
                      : 'bg-white text-blink-ink hover:bg-primary/20'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ─── Map ─── */}
      <div ref={mapContainerRef} className="flex-1 w-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="w-12 h-12 border-4 border-blink-ink border-t-primary animate-spin" />
        </div>
      )}

      {/* Error */}
      {mapError && (
        <div className="absolute inset-x-0 top-28 mx-4 z-30 bg-white border-2 border-blink-ink shadow-hard p-4">
          <p className="font-mono text-sm text-center">{mapError}</p>
        </div>
      )}

      {/* ─── My Location button ─── */}
      {position && (
        <button
          onClick={() => {
            if (!mapRef.current || !googleRef.current) return;
            const lat = position.latitude;
            const lng = position.longitude;
            const lngOff = km5InLng(lat);
            const bounds = new googleRef.current.maps.LatLngBounds(
              { lat: lat - KM5_IN_LAT, lng: lng - lngOff },
              { lat: lat + KM5_IN_LAT, lng: lng + lngOff },
            );
            mapRef.current.fitBounds(bounds);
          }}
          className="absolute right-4 z-20 bg-white border-2 border-blink-ink p-3 shadow-hard active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          style={{ bottom: sheetExpanded ? 'calc(45vh + 16px)' : 'calc(64px + 56px + 12px)' }}
        >
          <span className="material-symbols-outlined text-blink-ink">my_location</span>
        </button>
      )}

      {/* ─── Bottom Sheet ─── */}
      <div
        className="absolute left-0 w-full z-30 flex flex-col transition-all duration-300"
        style={{
          bottom: 64,
          maxHeight: sheetExpanded ? 'calc(45vh - 64px)' : '56px',
        }}
      >
        {/* Handle + Header */}
        <div
          className="bg-white border-t-2 border-blink-ink px-4 pt-3 pb-2 shadow-[0_-4px_0_0_rgba(0,0,0,1)] relative z-40 cursor-pointer touch-none"
          style={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
          onClick={() => setSheetExpanded(!sheetExpanded)}
          onTouchStart={(e) => {
            touchStartY.current = e.touches[0].clientY;
          }}
          onTouchEnd={(e) => {
            if (touchStartY.current === null) return;
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            touchStartY.current = null;
            // Swipe up → expand, swipe down → collapse (30px threshold)
            if (dy < -30) setSheetExpanded(true);
            else if (dy > 30) setSheetExpanded(false);
          }}
        >
          <div className="w-12 h-1.5 bg-blink-ink mx-auto mb-3 rounded-full" />
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-display text-lg uppercase leading-tight">
              {isSingleBusinessMode ? 'Sucursales' : 'Cerca de tu ubicación'}
            </h3>
            <span className="font-mono text-xs font-bold bg-primary px-2 py-1 border-2 border-blink-ink whitespace-nowrap">
              {mapMarkers.length} {isSingleBusinessMode ? 'SUCURSALES' : 'LUGARES'}
            </span>
          </div>
        </div>

        {/* List */}
        {sheetExpanded && (
          <div ref={listRef} className="bg-blink-bg overflow-y-auto pb-20 border-t-2 border-blink-ink">
            {mapMarkers.length === 0 && !isLoading && (
              <div className="py-8 text-center">
                <p className="font-mono text-sm text-blink-muted">Sin resultados en esta zona</p>
              </div>
            )}

            {mapMarkers.map(({ business: biz, lat, lng, address }, idx) => {
              const isSelected = isSingleBusinessMode
                ? selectedBusiness?.id === biz.id && selectedMarkerIdx === idx
                : selectedBusiness?.id === biz.id;
              return (
                <div
                  key={`${biz.id}-${idx}`}
                  data-biz-id={biz.id}
                  data-marker-idx={idx}
                  onClick={() => {
                    setSelectedBusiness(biz);
                    setSelectedMarkerIdx(idx);
                    mapRef.current?.panTo({ lat, lng });
                    if ((mapRef.current?.getZoom() || 0) < 15) mapRef.current?.setZoom(15);
                  }}
                  className={`border-b-2 border-blink-ink p-4 transition-colors cursor-pointer relative ${
                    isSelected ? 'bg-primary/10 active:bg-primary/20' : 'bg-white active:bg-gray-50'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary border-r-2 border-blink-ink" />
                  )}

                  <div className="flex gap-4 items-center">
                    {/* Logo */}
                    <div className="w-16 h-16 shrink-0 border-2 border-blink-ink bg-white flex items-center justify-center p-1 shadow-hard-sm">
                      {biz.image ? (
                        <img
                          alt={biz.name}
                          className={`w-full h-full object-contain ${isSelected ? '' : 'grayscale'}`}
                          src={biz.image}
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-display text-xl text-blink-muted">
                          {biz.name?.charAt(0)}
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-display text-base uppercase truncate">{biz.name}</h4>
                      <p className="font-mono text-xs text-gray-600 truncate mb-1">
                        {address}{biz.distanceText ? ` · ${biz.distanceText}` : ''}
                      </p>
                      {isSelected ? (
                        <div className="bg-blink-ink text-primary px-2 py-0.5 w-fit border border-primary transform -rotate-1 inline-block">
                          <span className="font-display text-sm leading-none">{getBestBenefitText(biz)}</span>
                        </div>
                      ) : (
                        <div className="bg-white text-blink-ink border-2 border-blink-ink px-2 py-0.5 w-fit inline-block">
                          <span className="font-bold text-xs font-mono">{getBestBenefitText(biz)}</span>
                        </div>
                      )}
                    </div>

                    {/* Arrow */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/business/${biz.id}`, { state: { business: biz } });
                      }}
                      className="w-10 h-10 border-2 border-blink-ink bg-white flex items-center justify-center shadow-hard-sm hover:bg-blink-ink hover:text-white transition-colors shrink-0"
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Filter Panel ─── */}
      <FilterPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onlineOnly={onlineOnly}
        onOnlineChange={setOnlineOnly}
        maxDistance={maxDistance}
        onMaxDistanceChange={setMaxDistance}
        minDiscount={minDiscount}
        onMinDiscountChange={setMinDiscount}
        availableDay={availableDay}
        onAvailableDayChange={setAvailableDay}
        cardMode={cardMode}
        onCardModeChange={setCardMode}
        network={network}
        onNetworkChange={setNetwork}
        hasInstallments={hasInstallments}
        onHasInstallmentsChange={setHasInstallments}
      />

      {/* ─── Bottom Nav ─── */}
      <BottomNav />

      {/* Ping animation keyframes (injected once) */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MapPage;
