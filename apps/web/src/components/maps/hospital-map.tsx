"use client";

import dynamic from "next/dynamic";
import type { MapMarker } from "./map-view";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function HospitalMap({
  latitude,
  longitude,
  markers = [],
}: {
  latitude: number;
  longitude: number;
  markers?: MapMarker[];
}) {
  return (
    <div
      role="region"
      aria-label="Map of your search area. Hospital markers appear only for verified records returned by the API."
      className="overflow-hidden rounded-xl border border-border"
    >
      <MapView latitude={latitude} longitude={longitude} markers={markers} />
    </div>
  );
}
