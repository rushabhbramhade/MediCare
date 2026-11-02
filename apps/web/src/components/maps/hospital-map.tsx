"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("./map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

export function HospitalMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <div
      role="region"
      aria-label="Map showing your approximate location. Hospital markers appear when a verified data source is connected."
      className="overflow-hidden rounded-xl border border-border"
    >
      <MapView latitude={latitude} longitude={longitude} />
    </div>
  );
}
