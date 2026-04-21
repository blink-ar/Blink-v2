import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import type { CanonicalLocation } from '../types';
import { MAP_STYLE_URL } from '../config/map';

interface LocationMapProps {
  locations: CanonicalLocation[];
  onMarkerClick?: (location: CanonicalLocation) => void;
  selectedLocation?: CanonicalLocation | null;
  className?: string;
}

const DEFAULT_ZOOM = 13;

const createMarkerElement = (isSelected: boolean) => {
  const pinSize = isSelected ? 36 : 28;
  const pinColor = isSelected ? '#3b82f6' : '#6366F1';
  const element = document.createElement('button');
  element.type = 'button';
  element.style.background = 'transparent';
  element.style.border = 'none';
  element.style.padding = '0';
  element.style.cursor = 'pointer';
  element.style.display = 'flex';
  element.style.alignItems = 'center';
  element.style.justifyContent = 'center';
  element.style.width = `${pinSize}px`;
  element.style.height = `${pinSize}px`;
  element.innerHTML = `
    <svg width="${pinSize}" height="${pinSize}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1.5"/>
          <feOffset dx="0" dy="1.5" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <g filter="url(#shadow)">
        <circle cx="24" cy="24" r="${isSelected ? 16 : 12}" fill="${pinColor}" stroke="#ffffff" stroke-width="2.5"/>
        <circle cx="24" cy="24" r="${isSelected ? 6 : 4.5}" fill="#ffffff"/>
      </g>
    </svg>
  `;
  return element;
};

const getPopupContent = (location: CanonicalLocation, showSelectedState: boolean) => `
  <div style="padding: 8px; min-width: 180px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">
      ${location.name || 'Ubicación'}
    </h3>
    <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.4;">
      ${location.formattedAddress || ''}
    </p>
    ${showSelectedState ? `
      <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; display: flex; align-items: center; gap: 6px;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;"></div>
        <span style="font-size: 11px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.025em;">Seleccionada</span>
      </div>
    ` : ''}
  </div>
`;

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  onMarkerClick,
  selectedLocation,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter out invalid locations (0,0 coordinates)
  const validLocations = useMemo(
    () => locations.filter((location) => location.lat !== 0 || location.lng !== 0),
    [locations],
  );
  const hasValidLocations = validLocations.length > 0;

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !hasValidLocations) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: [validLocations[0].lng, validLocations[0].lat],
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      dragRotate: false,
      touchPitch: false,
    });

    map.touchZoomRotate.disableRotation();
    map.addControl(
      new maplibregl.AttributionControl({
        compact: containerRef.current.clientWidth < 640,
      }),
      'bottom-right',
    );

    map.on('load', () => {
      setMapReady(true);
      setError(null);
    });

    map.on('error', (mapError) => {
      console.error('Failed to initialise MapLibre', mapError.error);
      setError('No se pudo cargar el mapa abierto.');
    });

    map.on('click', () => {
      popupRef.current?.remove();
    });

    mapRef.current = map;
  }, [clearMarkers, hasValidLocations, validLocations]);

  useEffect(() => {
    if (hasValidLocations || !mapRef.current) return;

    clearMarkers();
    popupRef.current?.remove();
    popupRef.current = null;
    mapRef.current.remove();
    mapRef.current = null;
    setMapReady(false);
  }, [clearMarkers, hasValidLocations]);

  useEffect(() => () => {
    clearMarkers();
    popupRef.current?.remove();
    popupRef.current = null;
    mapRef.current?.remove();
    mapRef.current = null;
    setMapReady(false);
  }, [clearMarkers]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    const map = mapRef.current;
    clearMarkers();
    popupRef.current?.remove();
    popupRef.current = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      maxWidth: '220px',
    });

    const bounds = new maplibregl.LngLatBounds();

    markersRef.current = validLocations.map((location) => {
      const isSelected =
        selectedLocation?.lat === location.lat && selectedLocation?.lng === location.lng;
      const markerElement = createMarkerElement(Boolean(isSelected));
      markerElement.setAttribute(
        'aria-label',
        location.name || location.formattedAddress || 'Ubicación',
      );

      markerElement.addEventListener('click', (event) => {
        event.stopPropagation();
        onMarkerClick?.(location);
        popupRef.current
          ?.setLngLat([location.lng, location.lat])
          .setHTML(getPopupContent(location, true))
          .addTo(map);
      });

      bounds.extend([location.lng, location.lat]);

      return new maplibregl.Marker({
        element: markerElement,
        anchor: 'center',
      })
        .setLngLat([location.lng, location.lat])
        .addTo(map);
    });

    if (selectedLocation) {
      map.easeTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: Math.max(map.getZoom(), 14),
        duration: 250,
      });
    } else if (validLocations.length > 1) {
      map.fitBounds(bounds, { padding: 32, maxZoom: 15 });
    } else {
      map.easeTo({
        center: [validLocations[0].lng, validLocations[0].lat],
        zoom: DEFAULT_ZOOM,
        duration: 250,
      });
    }
  }, [mapReady, onMarkerClick, selectedLocation, validLocations]);

  if (!hasValidLocations) {
    return null;
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="blink-map w-full h-56 rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
        role="region"
        aria-label="Mapa de ubicaciones del beneficio"
      />
      {error && <p className="mt-2 text-xs text-red-600 font-medium px-2">⚠️ {error}</p>}
    </div>
  );
};

export default LocationMap;
