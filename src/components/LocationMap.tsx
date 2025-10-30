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

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  onMarkerClick,
  selectedLocation,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const infoWindowRef = useRef<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
  };

  useEffect(() => {
    let cancelled = false;

    const initialiseMap = async () => {
      if (!containerRef.current || locations.length === 0) {
        return;
      }

      try {
        const googleMaps = (await getGoogleMaps()) as unknown;
        if (cancelled || !containerRef.current) {
          return;
        }

        const firstLocation = locations[0];
        const map =
          mapRef.current ||
          new googleMaps.maps.Map(containerRef.current, {
            center: { lat: firstLocation.lat, lng: firstLocation.lng },
            zoom: DEFAULT_ZOOM,
            mapTypeControl: false,
            fullscreenControl: false,
            streetViewControl: false,
            clickableIcons: false, // Disable default POI clicks
            disableDefaultUI: false,
          });

        // Prevent default map click behavior that shows blue dot
        if (!mapRef.current) {
          map.addListener("click", (event) => {
            event.stop();
          });
        }

        mapRef.current = map;
        infoWindowRef.current =
          infoWindowRef.current || new googleMaps.maps.InfoWindow();

        clearMarkers();

        const bounds = new googleMaps.maps.LatLngBounds();

        markersRef.current = locations.map((location) => {
          const isSelected =
            selectedLocation &&
            selectedLocation.lat === location.lat &&
            selectedLocation.lng === location.lng;

          // Create custom pin icon - larger for selected, normal for unselected
          const pinSize = isSelected ? 40 : 28;
          const pinColor = isSelected ? "#2563eb" : "#ef4444";

          const customIcon = {
            url:
              "data:image/svg+xml;charset=UTF-8," +
              encodeURIComponent(`
            <svg width="${pinSize}" height="${pinSize}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="${pinColor}" stroke="#ffffff" stroke-width="1"/>
            </svg>
          `),
            scaledSize: new googleMaps.maps.Size(pinSize, pinSize),
            anchor: new googleMaps.maps.Point(pinSize / 2, pinSize),
          };

          const marker = new googleMaps.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.name || location.formattedAddress || "Ubicación",
            icon: customIcon,
            optimized: false, // Prevents default Google Maps marker behavior
            clickable: true,
          });

          marker.addListener("click", (event) => {
            // Prevent default Google Maps behavior
            event.stop();

            if (onMarkerClick) {
              onMarkerClick(location);
            }

            const infoWindow = infoWindowRef.current;
            if (infoWindow) {
              const content = `
                <div style="font-size: 13px;">
                  <strong>${marker.getTitle() ?? "Ubicación"}</strong><br/>
                  <span>${location.formattedAddress ?? ""}</span><br/>
                  <span>${location.lat.toFixed(4)}, ${location.lng.toFixed(
                4
              )}</span>
                  ${
                    isSelected
                      ? '<br/><span style="color: #2563eb; font-weight: bold;">📍 Ubicación seleccionada</span>'
                      : ""
                  }
                </div>
              `;
              infoWindow.setContent(content);
              infoWindow.open({ anchor: marker, map });
            }
          });

          bounds.extend(marker.getPosition()!);
          return marker;
        });

        if (locations.length > 1) {
          map.fitBounds(bounds);
        } else {
          map.setCenter({ lat: locations[0].lat, lng: locations[0].lng });
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
  }, [locations, onMarkerClick, selectedLocation]);

  if (!locations?.length) {
    return null;
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="w-full h-48 rounded-lg border border-gray-200 shadow-inner"
        role="region"
        aria-label="Mapa de ubicaciones del beneficio"
      />
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default LocationMap;
