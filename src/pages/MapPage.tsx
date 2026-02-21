import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getGoogleMaps } from '../services/googleMapsLoader';
import { useGeolocation } from '../hooks/useGeolocation';
import { useBenefitsData, BenefitsFilters } from '../hooks/useBenefitsData';
import { useEnrichedBusinesses } from '../hooks/useEnrichedBusinesses';
import { Business } from '../types';
import BottomNav from '../components/neo/BottomNav';
import FilterPanel from '../components/neo/FilterPanel';
import {
  trackFilterApply,
  trackMapInteraction,
  trackNoResults,
  trackSearchIntent,
  trackSelectBusiness,
} from '../analytics/intentTracking';

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

const KM5_IN_LAT = 0.045;
const km5InLng = (lat: number) => 0.045 / Math.cos((lat * Math.PI) / 180);

// Soft, minimal map style — light roads, no clutter
const MAP_STYLE = [
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#dbeafe' }] },
  { featureType: 'landscape', elementType: 'geometry', stylers: [{ color: '#f7f6f4' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8e6e1' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#ecfdf5' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ca3af' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
];

const CATEGORY_CHIPS = [
  { id: 'nearby', label: '📍 Cerca de mí' },
  { id: 'gastronomia', label: '🍕 Gastronomía' },
  { id: 'moda', label: '👗 Moda' },
  { id: 'hogar', label: '🏠 Hogar' },
  { id: 'deportes', label: '⚽ Deportes' },
  { id: 'belleza', label: '💄 Belleza' },
  { id: 'electro', label: '💻 Electro' },
];

interface MapMarker {
  business: Business;
  lat: number;
  lng: number;
  address: string;
}

interface MapFilterState {
  activeChip: string;
  onlineOnly: boolean;
  minDiscount: number | undefined;
  maxDistance: number | undefined;
  availableDay: string | undefined;
  cardMode: 'credit' | 'debit' | undefined;
  network: string | undefined;
  hasInstallments: boolean | undefined;
}

function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const focusBusinessId = searchParams.get('business');

  const { position } = useGeolocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeChip, setActiveChip] = useState('nearby');
  const [showFilters, setShowFilters] = useState(false);

  const [minDiscount, setMinDiscount] = useState<number | undefined>();
  const [maxDistance, setMaxDistance] = useState<number | undefined>();
  const [availableDay, setAvailableDay] = useState<string | undefined>();
  const [cardMode, setCardMode] = useState<'credit' | 'debit' | undefined>();
  const [network, setNetwork] = useState<string | undefined>();
  const [hasInstallments, setHasInstallments] = useState<boolean | undefined>();
  const [onlineOnly, setOnlineOnly] = useState(false);

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

  const { businesses: rawBusinesses, isLoading } = useBenefitsData(filters);

  const businesses = useEnrichedBusinesses(rawBusinesses, {
    onlineOnly,
    minDiscount,
    maxDistance,
    availableDay,
    network,
    cardMode,
    hasInstallments,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const userOverlayRef = useRef<any>(null);
  const googleRef = useRef<any>(null);

  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedMarkerIdx, setSelectedMarkerIdx] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);
  const previousFilterStateRef = useRef<MapFilterState | null>(null);
  const hasInitializedFiltersRef = useRef(false);
  const searchIntentSignatureRef = useRef('');
  const noResultsSignatureRef = useRef('');
  const mapInteractionTimestampsRef = useRef<Record<string, number>>({});

  const isSingleBusinessMode = !!focusBusinessId;

  const activeFilterCount = [
    activeChip !== 'nearby',
    onlineOnly,
    minDiscount !== undefined,
    maxDistance !== undefined,
    availableDay !== undefined,
    cardMode !== undefined,
    network !== undefined,
    hasInstallments !== undefined,
  ].filter(Boolean).length;

  const currentFilterState = useMemo<MapFilterState>(() => ({
    activeChip,
    onlineOnly,
    minDiscount,
    maxDistance,
    availableDay,
    cardMode,
    network,
    hasInstallments,
  }), [activeChip, onlineOnly, minDiscount, maxDistance, availableDay, cardMode, network, hasInstallments]);

  const trackMapInteractionThrottled = useCallback((
    action: string,
    options: { zoomLevel?: number; businessId?: string; minIntervalMs?: number } = {},
  ) => {
    const { zoomLevel, businessId, minIntervalMs = 1000 } = options;
    const now = Date.now();
    const lastTs = mapInteractionTimestampsRef.current[action] ?? 0;
    if (now - lastTs < minIntervalMs) return;
    mapInteractionTimestampsRef.current[action] = now;
    trackMapInteraction({
      source: isSingleBusinessMode ? 'map_page_single_business' : 'map_page',
      action,
      zoomLevel,
      businessId,
    });
  }, [isSingleBusinessMode]);

  const focusedBusiness = useMemo(() => {
    if (!focusBusinessId) return null;
    return businesses.find((b) => b.id === focusBusinessId) || null;
  }, [focusBusinessId, businesses]);

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

  useEffect(() => {
    if (!hasInitializedFiltersRef.current) {
      hasInitializedFiltersRef.current = true;
      previousFilterStateRef.current = currentFilterState;
      return;
    }
    const previous = previousFilterStateRef.current;
    if (!previous) {
      previousFilterStateRef.current = currentFilterState;
      return;
    }
    const source = isSingleBusinessMode ? 'map_filters_single_business' : 'map_filters';
    if (previous.activeChip !== currentFilterState.activeChip) {
      trackFilterApply({ source, filterType: 'category', filterValue: currentFilterState.activeChip === 'nearby' ? undefined : currentFilterState.activeChip, activeFilterCount });
    }
    if (previous.onlineOnly !== currentFilterState.onlineOnly) {
      trackFilterApply({ source, filterType: 'online', filterValue: currentFilterState.onlineOnly, activeFilterCount });
    }
    if (previous.minDiscount !== currentFilterState.minDiscount) {
      trackFilterApply({ source, filterType: 'discount', filterValue: currentFilterState.minDiscount, activeFilterCount });
    }
    if (previous.maxDistance !== currentFilterState.maxDistance) {
      trackFilterApply({ source, filterType: 'distance', filterValue: currentFilterState.maxDistance, activeFilterCount });
    }
    if (previous.availableDay !== currentFilterState.availableDay) {
      trackFilterApply({ source, filterType: 'day', filterValue: currentFilterState.availableDay, activeFilterCount });
    }
    if (previous.cardMode !== currentFilterState.cardMode) {
      trackFilterApply({ source, filterType: 'card_mode', filterValue: currentFilterState.cardMode, activeFilterCount });
    }
    if (previous.network !== currentFilterState.network) {
      trackFilterApply({ source, filterType: 'network', filterValue: currentFilterState.network, activeFilterCount });
    }
    if (previous.hasInstallments !== currentFilterState.hasInstallments) {
      trackFilterApply({ source, filterType: 'installments', filterValue: currentFilterState.hasInstallments, activeFilterCount });
    }
    previousFilterStateRef.current = currentFilterState;
  }, [activeFilterCount, currentFilterState, isSingleBusinessMode]);

  useEffect(() => {
    if (isLoading || isSingleBusinessMode) return;
    const normalizedSearch = debouncedSearch.trim();
    const hasFilters = activeFilterCount > 0;
    if (!normalizedSearch && !hasFilters) return;
    const signature = [normalizedSearch, currentFilterState.activeChip, activeFilterCount, mapMarkers.length].join('|');
    if (searchIntentSignatureRef.current === signature) return;
    searchIntentSignatureRef.current = signature;
    trackSearchIntent({ source: 'map_page', searchTerm: normalizedSearch, resultsCount: mapMarkers.length, hasFilters, activeFilterCount, category: currentFilterState.activeChip !== 'nearby' ? currentFilterState.activeChip : undefined });
  }, [activeFilterCount, currentFilterState.activeChip, debouncedSearch, isLoading, isSingleBusinessMode, mapMarkers.length]);

  useEffect(() => {
    if (isLoading || mapMarkers.length > 0) return;
    const normalizedSearch = debouncedSearch.trim();
    if (!normalizedSearch && activeFilterCount === 0) return;
    const signature = [normalizedSearch, currentFilterState.activeChip, activeFilterCount, 'empty'].join('|');
    if (noResultsSignatureRef.current === signature) return;
    noResultsSignatureRef.current = signature;
    trackNoResults({ source: isSingleBusinessMode ? 'map_page_single_business' : 'map_page', searchTerm: normalizedSearch, activeFilterCount, category: currentFilterState.activeChip !== 'nearby' ? currentFilterState.activeChip : undefined });
  }, [activeFilterCount, currentFilterState.activeChip, debouncedSearch, isLoading, isSingleBusinessMode, mapMarkers.length]);

  const getMaxDiscount = (biz: Business) => {
    let max = 0;
    biz.benefits.forEach((b) => {
      const m = b.rewardRate.match(/(\d+)%/);
      if (m) max = Math.max(max, parseInt(m[1]));
    });
    return max;
  };

  const getBestBenefitLabel = (biz: Business) => {
    const max = getMaxDiscount(biz);
    if (max > 0) return `Hasta ${max}% OFF`;
    const withInstallments = biz.benefits.find((b) => b.installments && b.installments > 0);
    if (withInstallments) return `${withInstallments.installments} cuotas s/int.`;
    return `${biz.benefits.length} beneficios`;
  };

  const getShortBenefitForTooltip = (biz: Business) => {
    const max = getMaxDiscount(biz);
    const bank = biz.benefits[0]?.bankName?.replace(/banco\s*/i, '').substring(0, 8) || '';
    if (max > 0) return `${max}% OFF${bank ? ` · ${bank}` : ''}`;
    const withInstallments = biz.benefits.find((b) => b.installments && b.installments > 0);
    if (withInstallments) return `${withInstallments.installments} cuotas${bank ? ` · ${bank}` : ''}`;
    return bank || 'Ver beneficios';
  };

  // ─── Overlays ──────────────────────────────────────────────────

  const clearOverlays = useCallback(() => {
    overlaysRef.current.forEach((o) => o.setMap(null));
    overlaysRef.current = [];
  }, []);

  const buildOverlays = useCallback((google: any, map: any, selected: Business | null) => {
    clearOverlays();

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
        const size = this.isSelected ? 52 : 42;
        const imgSize = this.isSelected ? 34 : 26;

        let html = '';

        // Soft glassmorphic tooltip for selected
        if (this.isSelected) {
          const benefitText = getShortBenefitForTooltip(this.biz);
          html += `
            <div style="position:absolute;bottom:100%;left:50%;transform:translateX(-50%);margin-bottom:10px;white-space:nowrap;
              background:rgba(255,255,255,0.96);border-radius:12px;
              box-shadow:0 4px 20px rgba(99,102,241,0.18),0 1px 4px rgba(0,0,0,0.08);
              padding:7px 12px;display:flex;flex-direction:column;align-items:center;
              z-index:200;pointer-events:none;border:1px solid rgba(199,210,254,0.8);">
              <span style="color:#1C1C1E;font-family:'Space Grotesk',sans-serif;font-size:12px;font-weight:600;line-height:1.3;">${this.biz.name}</span>
              <span style="color:#6366f1;font-family:'Space Grotesk',sans-serif;font-size:11px;font-weight:500;margin-top:1px;">${benefitText}</span>
              <div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%) rotate(45deg);width:9px;height:9px;background:rgba(255,255,255,0.96);border-right:1px solid rgba(199,210,254,0.8);border-bottom:1px solid rgba(199,210,254,0.8);"></div>
            </div>`;
        }

        // Marker: white circle with soft shadow + indigo ring when selected
        const ringStyle = this.isSelected
          ? 'box-shadow:0 0 0 3px rgba(99,102,241,0.35),0 4px 16px rgba(99,102,241,0.25),0 2px 6px rgba(0,0,0,0.10);border:2px solid #6366f1;background:#ffffff;'
          : 'box-shadow:0 2px 8px rgba(0,0,0,0.12),0 1px 2px rgba(0,0,0,0.06);border:1.5px solid #E8E6E1;background:#ffffff;';

        html += `
          <div style="width:${size}px;height:${size}px;border-radius:50%;${ringStyle}
            display:flex;align-items:center;justify-content:center;position:relative;z-index:20;
            transition:all 0.15s;">
            ${this.imgSrc
              ? `<img src="${this.imgSrc}" alt="" style="width:${imgSize}px;height:${imgSize}px;object-fit:contain;border-radius:50%;${this.isSelected ? '' : 'opacity:0.75;'}" />`
              : `<span style="font-family:'Space Grotesk',sans-serif;font-size:${this.isSelected ? 18 : 14}px;font-weight:700;color:${this.isSelected ? '#6366f1' : '#6B7280'};">${this.biz.name?.charAt(0) || '?'}</span>`
            }
          </div>`;

        // Soft drop shadow dot
        html += `<div style="width:12px;height:4px;background:rgba(0,0,0,0.10);border-radius:50%;margin:2px auto 0;filter:blur(1px);"></div>`;

        this.div.innerHTML = html;
      }

      draw() {
        if (!this.div) return;
        const proj = this.getProjection();
        if (!proj) return;
        const px = proj.fromLatLngToDivPixel(this.pos);
        if (px) {
          const size = this.isSelected ? 52 : 42;
          this.div.style.left = (px.x - size / 2) + 'px';
          this.div.style.top = (px.y - size - 4) + 'px';
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
        if (this.div) this.div.style.zIndex = isSelected ? '100' : '10';
        this.render();
        this.draw();
      }
    }

    mapMarkers.forEach(({ business: biz, lat, lng }, idx) => {
      const isSelected = isSingleBusinessMode
        ? selected?.id === biz.id && idx === 0
        : selected?.id === biz.id;
      const pos = new google.maps.LatLng(lat, lng);
      const overlay = new BusinessOverlay(pos, biz, isSelected, biz.image || '', () => {
        trackMapInteractionThrottled('marker_click', { businessId: biz.id, zoomLevel: map.getZoom() || undefined, minIntervalMs: 400 });
        trackSelectBusiness({ source: 'map_marker', businessId: biz.id, category: biz.category });
        setSelectedBusiness(biz);
        setSelectedMarkerIdx(idx);
        map.panTo(pos);
      });
      overlay.setMap(map);
      (overlay as any).__businessId = biz.id;
      (overlay as any).__markerIdx = idx;
      overlaysRef.current.push(overlay);
    });
  }, [mapMarkers, clearOverlays, isSingleBusinessMode, trackMapInteractionThrottled]);

  // ─── User location overlay ────────────────────────────────────

  const createUserLocationOverlay = useCallback((google: any, map: any, lat: number, lng: number) => {
    if (userOverlayRef.current) userOverlayRef.current.setMap(null);

    class UserLocationOverlay extends google.maps.OverlayView {
      private pos: any;
      private div: HTMLDivElement | null = null;
      constructor(pos: any) { super(); this.pos = pos; }

      onAdd() {
        this.div = document.createElement('div');
        this.div.style.position = 'absolute';
        this.div.style.zIndex = '5';
        this.div.style.pointerEvents = 'none';
        // Soft indigo pulse dot instead of harsh pink
        this.div.innerHTML = `
          <div style="position:relative;width:22px;height:22px;">
            <div style="position:absolute;inset:0;background:rgba(99,102,241,0.20);border-radius:50%;animation:blink-ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;inset:4px;background:#6366f1;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(99,102,241,0.40);"></div>
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
          this.div.style.left = (px.x - 11) + 'px';
          this.div.style.top = (px.y - 11) + 'px';
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
          trackMapInteractionThrottled('map_click', { zoomLevel: mapRef.current?.getZoom() || undefined, minIntervalMs: 500 });
        });
      }

      if (!(mapRef.current as { __intentListenersAttached?: boolean }).__intentListenersAttached) {
        mapRef.current.addListener('dragend', () => {
          trackMapInteractionThrottled('pan', { zoomLevel: mapRef.current?.getZoom() || undefined, minIntervalMs: 1500 });
        });
        mapRef.current.addListener('zoom_changed', () => {
          trackMapInteractionThrottled('zoom', { zoomLevel: mapRef.current?.getZoom() || undefined, minIntervalMs: 800 });
        });
        (mapRef.current as { __intentListenersAttached?: boolean }).__intentListenersAttached = true;
      }

      if (position) {
        createUserLocationOverlay(google, mapRef.current, position.latitude, position.longitude);
      }

      buildOverlays(google, mapRef.current, selectedBusiness);

      if (isSingleBusinessMode) {
        if (mapMarkers.length > 0) {
          const bounds = new google.maps.LatLngBounds();
          mapMarkers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
          if (mapMarkers.length === 1) {
            mapRef.current.setCenter({ lat: mapMarkers[0].lat, lng: mapMarkers[0].lng });
            mapRef.current.setZoom(16);
          } else {
            mapRef.current.fitBounds(bounds);
          }
          if (focusedBusiness) {
            setSelectedBusiness(focusedBusiness);
            setSelectedMarkerIdx(0);
            mapRef.current.panTo({ lat: mapMarkers[0].lat, lng: mapMarkers[0].lng });
          }
        }
      } else if (position) {
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
  }, [position, mapMarkers, isSingleBusinessMode, focusedBusiness, buildOverlays, createUserLocationOverlay, trackMapInteractionThrottled]);

  useEffect(() => {
    if (!isLoading && rawBusinesses.length > 0) initMap();
  }, [isLoading, rawBusinesses.length, initMap]);

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

  return (
    <div className="bg-blink-bg text-blink-ink font-body h-[100dvh] flex flex-col overflow-hidden relative">

      {/* ─── Floating Header ─── */}
      <header className="absolute top-0 left-0 w-full z-30 px-4 pt-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2.5">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-11 h-11 rounded-2xl active:scale-95 transition-all shrink-0"
            style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(232,230,225,0.8)' }}
          >
            <span className="material-symbols-outlined text-blink-ink" style={{ fontSize: 22 }}>arrow_back</span>
          </button>

          {isSingleBusinessMode ? (
            /* Single business: frosted pill with name + branch count */
            <div
              className="flex-1 h-11 rounded-2xl flex items-center px-4 gap-2.5 min-w-0"
              style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(232,230,225,0.8)' }}
            >
              <span className="font-semibold text-sm text-blink-ink truncate flex-1">
                {focusedBusiness?.name || 'Cargando...'}
              </span>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap shrink-0"
                style={{ background: '#EEF2FF', color: '#4338CA' }}
              >
                {mapMarkers.length} {mapMarkers.length === 1 ? 'sucursal' : 'sucursales'}
              </span>
            </div>
          ) : (
            <>
              {/* Search */}
              <div
                className="flex-1 h-11 rounded-2xl flex items-center px-3.5 gap-2 relative"
                style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid rgba(232,230,225,0.8)' }}
              >
                <span className="material-symbols-outlined text-blink-muted flex-shrink-0" style={{ fontSize: 18 }}>search</span>
                <input
                  className="flex-1 bg-transparent text-sm text-blink-ink placeholder-blink-muted focus:outline-none"
                  placeholder="Buscar tiendas..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-blink-muted">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(true)}
                className="flex items-center justify-center w-11 h-11 rounded-2xl active:scale-95 transition-all shrink-0 relative"
                style={{ background: activeFilterCount > 0 ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' : 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: activeFilterCount > 0 ? 'none' : '1px solid rgba(232,230,225,0.8)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 22, color: activeFilterCount > 0 ? 'white' : '#6B7280' }}>tune</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-white rounded-full text-primary text-[9px] font-bold flex items-center justify-center" style={{ width: 18, height: 18, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Category chips — browse mode only */}
        {!isSingleBusinessMode && (
          <div className="pointer-events-auto w-full overflow-x-auto no-scrollbar mt-2.5">
            <div className="flex gap-2 min-w-max pb-1">
              {CATEGORY_CHIPS.map((chip) => {
                const isActive = activeChip === chip.id;
                return (
                  <button
                    key={chip.id}
                    onClick={() => setActiveChip(chip.id)}
                    className="px-3.5 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all duration-150 active:scale-95"
                    style={isActive ? {
                      background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                      color: 'white',
                      boxShadow: '0 2px 10px rgba(99,102,241,0.30)',
                    } : {
                      background: 'rgba(255,255,255,0.92)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      color: '#6B7280',
                      border: '1px solid rgba(232,230,225,0.8)',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                    }}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* ─── Map ─── */}
      <div ref={mapContainerRef} className="flex-1 w-full" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="w-10 h-10 rounded-full border-2 border-blink-border border-t-primary animate-spin" />
        </div>
      )}

      {/* Error */}
      {mapError && (
        <div
          className="absolute inset-x-4 top-28 z-30 bg-white rounded-2xl p-4 text-center"
          style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.10)', border: '1px solid #E8E6E1' }}
        >
          <span className="material-symbols-outlined text-blink-muted block mb-2" style={{ fontSize: 28 }}>map_off</span>
          <p className="text-sm text-blink-muted">{mapError}</p>
        </div>
      )}

      {/* ─── My Location button ─── */}
      {position && (
        <button
          onClick={() => {
            if (!mapRef.current || !googleRef.current) return;
            trackMapInteractionThrottled('recenter_user_location', { zoomLevel: mapRef.current?.getZoom() || undefined, minIntervalMs: 500 });
            const lat = position.latitude;
            const lng = position.longitude;
            const lngOff = km5InLng(lat);
            const bounds = new googleRef.current.maps.LatLngBounds(
              { lat: lat - KM5_IN_LAT, lng: lng - lngOff },
              { lat: lat + KM5_IN_LAT, lng: lng + lngOff },
            );
            mapRef.current.fitBounds(bounds);
          }}
          className="absolute right-4 z-20 w-11 h-11 flex items-center justify-center rounded-2xl active:scale-95 transition-all"
          style={{
            bottom: sheetExpanded ? 'calc(45vh - 64px + 16px)' : 'calc(64px + 56px + 12px)',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            border: '1px solid rgba(232,230,225,0.8)',
          }}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>my_location</span>
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
          className="px-4 pt-3 pb-2 relative z-40 cursor-pointer touch-none"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderRadius: '20px 20px 0 0',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.07)',
            borderTop: '1px solid rgba(232,230,225,0.8)',
          }}
          onClick={() => setSheetExpanded(!sheetExpanded)}
          onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
          onTouchEnd={(e) => {
            if (touchStartY.current === null) return;
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            touchStartY.current = null;
            if (dy < -30) setSheetExpanded(true);
            else if (dy > 30) setSheetExpanded(false);
          }}
        >
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-semibold text-base text-blink-ink">
              {isSingleBusinessMode ? 'Sucursales' : 'Cerca de vos'}
            </h3>
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: '#EEF2FF', color: '#4338CA' }}
            >
              {mapMarkers.length} {isSingleBusinessMode ? 'sucursales' : 'lugares'}
            </span>
          </div>
        </div>

        {/* List */}
        {sheetExpanded && (
          <div
            ref={listRef}
            className="overflow-y-auto pb-4 flex flex-col gap-2 px-3 pt-2"
            style={{ background: '#F7F6F4' }}
          >
            {mapMarkers.length === 0 && !isLoading && (
              <div className="py-10 text-center">
                <span className="material-symbols-outlined text-blink-muted block mb-2" style={{ fontSize: 36 }}>search_off</span>
                <p className="text-sm text-blink-muted">Sin resultados en esta zona</p>
              </div>
            )}

            {mapMarkers.map(({ business: biz, lat, lng, address }, idx) => {
              const isSelected = isSingleBusinessMode
                ? selectedBusiness?.id === biz.id && selectedMarkerIdx === idx
                : selectedBusiness?.id === biz.id;
              const maxDiscount = getMaxDiscount(biz);

              return (
                <div
                  key={`${biz.id}-${idx}`}
                  data-biz-id={biz.id}
                  data-marker-idx={idx}
                  onClick={() => {
                    trackMapInteractionThrottled('list_select', { businessId: biz.id, zoomLevel: mapRef.current?.getZoom() || undefined, minIntervalMs: 300 });
                    trackSelectBusiness({ source: 'map_list', businessId: biz.id, category: biz.category, position: idx + 1 });
                    setSelectedBusiness(biz);
                    setSelectedMarkerIdx(idx);
                    mapRef.current?.panTo({ lat, lng });
                    if ((mapRef.current?.getZoom() || 0) < 15) mapRef.current?.setZoom(15);
                  }}
                  className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-150 active:scale-[0.98] relative"
                  style={isSelected ? {
                    background: '#ffffff',
                    border: '1.5px solid #c7d2fe',
                    boxShadow: '0 2px 12px rgba(99,102,241,0.12)',
                  } : {
                    background: '#ffffff',
                    border: '1px solid #E8E6E1',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div
                      className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                      style={{ background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)' }}
                    />
                  )}

                  {/* Logo */}
                  <div
                    className="w-14 h-14 shrink-0 rounded-xl flex items-center justify-center p-1.5 overflow-hidden"
                    style={{ background: '#F7F6F4', border: '1px solid #E8E6E1' }}
                  >
                    {biz.image ? (
                      <img
                        alt={biz.name}
                        className="w-full h-full object-contain"
                        src={biz.image}
                        loading="lazy"
                      />
                    ) : (
                      <span className="font-bold text-xl text-blink-muted">{biz.name?.charAt(0)}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-blink-ink truncate">{biz.name}</h4>
                    <p className="text-xs text-blink-muted truncate mt-0.5">
                      {address}{biz.distanceText ? ` · ${biz.distanceText}` : ''}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      {maxDiscount > 0 ? (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#D1FAE5', color: '#065F46' }}
                        >
                          Hasta {maxDiscount}% OFF
                        </span>
                      ) : (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: '#EEF2FF', color: '#4338CA' }}
                        >
                          {getBestBenefitLabel(biz)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Navigate to detail */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      trackSelectBusiness({ source: 'map_list_open_business', businessId: biz.id, category: biz.category, position: idx + 1 });
                      navigate(`/business/${biz.id}`, { state: { business: biz } });
                    }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all active:scale-95"
                    style={{ background: '#EEF2FF', color: '#4338CA' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
                  </button>
                </div>
              );
            })}

            <div className="h-4" />
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

      {/* Animations */}
      <style>{`
        @keyframes blink-ping {
          75%, 100% { transform: scale(2.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default MapPage;
