"use client";

import { useEffect, useRef, useCallback, type CSSProperties } from "react";
import { publicEnv } from "@/lib/env";

export interface GoogleMapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Google Maps JavaScript API map view.
 *
 * The Maps JS API script is loaded dynamically on mount using the browser-safe
 * NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. The backend server key is never used here.
 *
 * Renders a search-location marker and hospital markers. OSM/Leaflet remains
 * the fallback when MAP_PROVIDER is not "google".
 */
export default function GoogleMapView({
  latitude,
  longitude,
  markers = [],
}: {
  latitude: number;
  longitude: number;
  markers?: GoogleMapMarker[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const centerMarkerRef = useRef<google.maps.Marker | null>(null);
  const scriptLoadingRef = useRef<boolean>(false);

  const apiKey = publicEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isGoogle = publicEnv.NEXT_PUBLIC_MAP_PROVIDER === "google";

  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (centerMarkerRef.current) {
      centerMarkerRef.current.setMap(null);
      centerMarkerRef.current = null;
    }
  }, []);

  const renderMarkers = useCallback(() => {
    if (!mapRef.current) return;
    clearMarkers();

    const center = { lat: latitude, lng: longitude };
    centerMarkerRef.current = new window.google.maps.Marker({
      position: center,
      map: mapRef.current,
      title: "Search location",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#0f766e",
        fillOpacity: 0.9,
        strokeColor: "#0f766e",
        strokeWeight: 2,
      },
    });

    markersRef.current = markers.map((marker) => {
      return new window.google.maps.Marker({
        position: { lat: marker.latitude, lng: marker.longitude },
        map: mapRef.current,
        title: marker.label,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: "#b91c1c",
          fillOpacity: 0.8,
          strokeColor: "#b91c1c",
          strokeWeight: 2,
        },
      });
    });
  }, [latitude, longitude, markers, clearMarkers]);

  const initMap = useCallback(() => {
    if (!containerRef.current || !isGoogle || !apiKey || mapRef.current) return;
    if (!window.google?.maps) return;

    mapRef.current = new window.google.maps.Map(containerRef.current, {
      center: { lat: latitude, lng: longitude },
      zoom: publicEnv.NEXT_PUBLIC_MAP_DEFAULT_ZOOM,
      scrollwheel: false,
    });
    renderMarkers();
  }, [latitude, longitude, apiKey, isGoogle, renderMarkers]);

  const loadScript = useCallback((): Promise<void> => {
    if (!isGoogle || !apiKey) return Promise.resolve();
    if (window.google?.maps) return Promise.resolve();
    if (scriptLoadingRef.current) {
      return new Promise<void>((resolve) => {
        const check = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(check);
            resolve();
          }
        }, 50);
        setTimeout(() => { clearInterval(check); resolve(); }, 10_000);
      });
    }

    return new Promise<void>((resolve, reject) => {
      scriptLoadingRef.current = true;
      const script = document.createElement("script");
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${apiKey}&region=IN&language=en`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        scriptLoadingRef.current = false;
        resolve();
      };
      script.onerror = () => {
        scriptLoadingRef.current = false;
        reject(new Error("Failed to load Google Maps JavaScript API"));
      };
      document.head.appendChild(script);
    });
  }, [apiKey, isGoogle]);

  // Load the Maps JS API script when the provider is Google.
  useEffect(() => {
    if (!isGoogle || !apiKey) return;
    loadScript().then(initMap).catch((err) => {
      if (typeof window !== "undefined" && window.location.hostname === "localhost") {
        // eslint-disable-next-line no-console
        console.warn("Google Maps failed to load", err);
      }
    });
  }, [isGoogle, apiKey, loadScript, initMap]);

  // Re-render markers when dependencies change.
  useEffect(() => {
    if (mapRef.current) renderMarkers();
  }, [latitude, longitude, markers, renderMarkers]);

  const style: CSSProperties = { height: "100%", width: "100%" };

  return (
    <div
      ref={containerRef}
      className="h-80 w-full rounded-xl"
      style={style}
      role="region"
      aria-label={
        isGoogle
          ? "Google Map of your search area. Hospital markers appear only for verified records returned by the API."
          : ""
      }
    />
  );
}
