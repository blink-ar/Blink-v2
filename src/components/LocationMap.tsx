import React, { useEffect, useRef, useState } from "react";
import type { CanonicalLocation } from "../types";
import { getGoogleMaps } from "../services/googleMapsLoader";

interface LocationMapProps {
  locations: CanonicalLocation[];
  onMarkerClick?: (location: CanonicalLocation) => void;
  className?: string;
}

const DEFAULT_ZOOM = 13;

const LocationMap: React.FC<LocationMapProps> = ({
  locations,
  onMarkerClick,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
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
          });

        mapRef.current = map;
        infoWindowRef.current =
          infoWindowRef.current || new googleMaps.maps.InfoWindow();

        clearMarkers();

        const bounds = new googleMaps.maps.LatLngBounds();

        markersRef.current = locations.map((location) => {
          const marker = new googleMaps.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map,
            title: location.name || location.formattedAddress || "Ubicación",
          });

          marker.addListener("click", () => {
            if (location.placeId) {
              console.log("Marker selected:", location.placeId);
            }
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
  }, [locations, onMarkerClick]);

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
