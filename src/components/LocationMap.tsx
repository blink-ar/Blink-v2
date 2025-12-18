import React, { useEffect, useRef, useState } from "react";
import type { CanonicalLocation } from "../types";
import { getGoogleMaps } from "../services/googleMapsLoader";

interface LocationMapProps {
  locations: CanonicalLocation[];
  onMarkerClick?: (location: CanonicalLocation) => void;
  selectedLocation?: CanonicalLocation | null;
  className?: string;
}

const DEFAULT_ZOOM = 13;

const MAP_STYLE = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e9f2fe" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f8f9fa" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e8f5e9" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#74787c" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
];

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  onMarkerClick,
  selectedLocation,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Filter out invalid locations (0,0 coordinates)
  const validLocations = locations.filter(
    (location) => location.lat !== 0 || location.lng !== 0
  );

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    let cancelled = false;

    const initialiseMap = async () => {
      if (!containerRef.current || validLocations.length === 0) {
        return;
      }

      try {
        const googleMaps = (await getGoogleMaps()) as any;
        if (cancelled || !containerRef.current) {
          return;
        }

        const firstLocation = validLocations[0];
        const map =
          mapRef.current ||
          new googleMaps.maps.Map(containerRef.current, {
            center: { lat: firstLocation.lat, lng: firstLocation.lng },
            zoom: DEFAULT_ZOOM,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            clickableIcons: false, // Disable default POI clicks
            disableDefaultUI: true,
            styles: MAP_STYLE,
          });

        // Prevent default map click behavior that shows blue dot
        if (!mapRef.current) {
          map.addListener("click", (event: any) => {
            if (event && event.stop) event.stop();
          });
        }

        mapRef.current = map;
        infoWindowRef.current =
          infoWindowRef.current || new googleMaps.maps.InfoWindow();

        clearMarkers();

        const bounds = new googleMaps.maps.LatLngBounds();

        markersRef.current = validLocations.map((location) => {
          const isSelected =
            selectedLocation &&
            selectedLocation.lat === location.lat &&
            selectedLocation.lng === location.lng;

          // Create modern custom marker - circle with dot and shadow
          const pinSize = isSelected ? 36 : 28;
          const pinColor = isSelected ? "#3b82f6" : "#6366f1";
          
          const customIcon = {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
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
          `),
            scaledSize: new googleMaps.maps.Size(pinSize, pinSize),
            anchor: new googleMaps.maps.Point(pinSize / 2, pinSize / 2),
          };

          const marker = new googleMaps.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.name || location.formattedAddress || "Ubicación",
            icon: customIcon,
            optimized: false,
            zIndex: isSelected ? 1000 : 1,
            clickable: true,
          });

          marker.addListener("click", (event: any) => {
            if (event && event.stop) event.stop();

            if (onMarkerClick) {
              onMarkerClick(location);
            }

            const infoWindow = infoWindowRef.current;
            if (infoWindow) {
              const content = `
                <div style="padding: 8px; min-width: 180px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
                  <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">
                    ${location.name || "Ubicación"}
                  </h3>
                  <p style="margin: 0; font-size: 12px; color: #4b5563; line-height: 1.4;">
                    ${location.formattedAddress || ""}
                  </p>
                  ${isSelected ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #f3f4f6; display: flex; align-items: center; gap: 6px;">
                      <div style="width: 6px; height: 6px; border-radius: 50%; background: #3b82f6;"></div>
                      <span style="font-size: 11px; font-weight: 600; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.025em;">Seleccionada</span>
                    </div>
                  ` : ""}
                </div>
              `;
              infoWindow.setContent(content);
              infoWindow.open({ anchor: marker, map });
            }
          });

          bounds.extend(marker.getPosition()!);
          return marker;
        });

        if (selectedLocation) {
          map.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
          // Use a slightly more pulled-back zoom level
          if (map.getZoom() < 14) {
            map.setZoom(14);
          }
        } else if (validLocations.length > 1) {
          map.fitBounds(bounds);
        } else {
          map.setCenter({ lat: validLocations[0].lat, lng: validLocations[0].lng });
          map.setZoom(DEFAULT_ZOOM);
        }

        setError(null);
      } catch (mapError) {
        if (!cancelled) {
          console.error("Failed to initialise Google Maps", mapError);
          setError(
            "No se pudo cargar el mapa de Google. Verifica tu clave de Google Maps."
          );
        }
      }
    };

    initialiseMap();

    return () => {
      cancelled = true;
      clearMarkers();
    };
  }, [validLocations, onMarkerClick, selectedLocation]);

  if (!validLocations?.length) {
    return null;
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="w-full h-56 rounded-2xl border border-gray-200 shadow-lg overflow-hidden"
        role="region"
        aria-label="Mapa de ubicaciones del beneficio"
      />
      {error && <p className="mt-2 text-xs text-red-600 font-medium px-2">⚠️ {error}</p>}
    </div>
  );
};

export default LocationMap;
