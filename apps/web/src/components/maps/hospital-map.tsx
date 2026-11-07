"use client";

import {
  Crosshair,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { HospitalSummary } from "@medicare/types";
import type { HospitalBounds } from "@/features/hospitals/use-hospital-search";
import { publicEnv } from "@/lib/env";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/stores/location-store";

type MapHospital = Pick<
  HospitalSummary,
  "id" | "name" | "latitude" | "longitude" | "hasEmergency"
>;

function MapEvents({
  center,
  hospitals,
  selectedId,
  onBoundsChange,
}: {
  center: Coordinates;
  hospitals: MapHospital[];
  selectedId: string | null;
  onBoundsChange: (bounds: HospitalBounds) => void;
}) {
  const map = useMap();
  const lastCenter = useRef<string | null>(null);
  const lastSelected = useRef<string | null>(null);

  useMapEvents({
    moveend() {
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
      });
    },
  });

  useEffect(() => {
    const key = `${center.latitude},${center.longitude}`;
    if (lastCenter.current === key) return;
    lastCenter.current = key;
    map.flyTo([center.latitude, center.longitude], Math.max(map.getZoom(), 13), {
      animate: true,
    });
  }, [center.latitude, center.longitude, map]);

  useEffect(() => {
    if (!selectedId || lastSelected.current === selectedId) return;
    const selected = hospitals.find((hospital) => hospital.id === selectedId);
    if (!selected) return;
    lastSelected.current = selectedId;
    map.panTo([selected.latitude, selected.longitude], { animate: true });
  }, [selectedId, hospitals, map]);

  return null;
}

function MapControls({ center }: { center: Coordinates }) {
  const map = useMap();
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  async function toggleFullscreen() {
    const container = map.getContainer();
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // Browsers can refuse fullscreen without a user gesture or in an iframe.
    }
  }

  const buttonClass =
    "flex h-9 w-9 items-center justify-center text-foreground transition-colors hover:bg-accent";

  return (
    <div className="absolute right-3 top-3 z-[1000] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
      <button
        type="button"
        className={buttonClass}
        title="Recenter on my location"
        aria-label="Recenter on my location"
        onClick={() =>
          map.setView([center.latitude, center.longitude], Math.max(map.getZoom(), 14), {
            animate: true,
          })
        }
      >
        <Crosshair aria-hidden="true" className="h-4 w-4 text-primary" />
      </button>
      <div className="h-px w-full bg-border" />
      <button
        type="button"
        className={buttonClass}
        title="Zoom in"
        aria-label="Zoom in"
        onClick={() => map.zoomIn()}
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
      </button>
      <div className="h-px w-full bg-border" />
      <button
        type="button"
        className={buttonClass}
        title="Zoom out"
        aria-label="Zoom out"
        onClick={() => map.zoomOut()}
      >
        <Minus aria-hidden="true" className="h-4 w-4" />
      </button>
      <div className="h-px w-full bg-border" />
      <button
        type="button"
        className={buttonClass}
        title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={() => void toggleFullscreen()}
      >
        {fullscreen ? (
          <Minimize2 aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Maximize2 aria-hidden="true" className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

export function HospitalMap({
  center,
  hospitals,
  selectedId,
  onSelect,
  onBoundsChange,
  className,
}: {
  center: Coordinates;
  hospitals: MapHospital[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBoundsChange: (bounds: HospitalBounds) => void;
  className?: string;
}) {
  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={14}
      zoomControl={false}
      scrollWheelZoom
      className={cn("h-full w-full", className)}
    >
      <TileLayer
        url={publicEnv.NEXT_PUBLIC_MAP_TILE_URL}
        attribution={publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION}
      />

      <MapEvents
        center={center}
        hospitals={hospitals}
        selectedId={selectedId}
        onBoundsChange={onBoundsChange}
      />

      <CircleMarker
        center={[center.latitude, center.longitude]}
        radius={8}
        pathOptions={{
          color: "#ffffff",
          weight: 3,
          fillColor: "#3977d5",
          fillOpacity: 1,
        }}
      >
        <Tooltip>Your search location</Tooltip>
      </CircleMarker>

      {hospitals.map((hospital) => {
        const selected = hospital.id === selectedId;
        const emergency = hospital.hasEmergency === true;
        return (
          <CircleMarker
            key={hospital.id}
            center={[hospital.latitude, hospital.longitude]}
            radius={selected ? 11 : 7}
            pathOptions={{
              color: "#ffffff",
              weight: selected ? 3 : 2,
              fillColor: emergency ? "#dc2626" : "#087e8b",
              fillOpacity: selected ? 1 : 0.85,
            }}
            eventHandlers={{ click: () => onSelect(hospital.id) }}
          >
            <Tooltip direction="top" offset={[0, -8]}>
              {hospital.name}
            </Tooltip>
          </CircleMarker>
        );
      })}

      <MapControls center={center} />
    </MapContainer>
  );
}
