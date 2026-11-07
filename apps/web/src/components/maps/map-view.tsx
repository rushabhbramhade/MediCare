"use client";

import dynamic from "next/dynamic";
import { publicEnv } from "@/lib/env";

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  label: string;
}

const GoogleMapView = dynamic(
  () => import("./google-map-view").then((mod) => ({ default: mod.default })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

const LeafletMapView = dynamic(() => import("./leaflet-map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-80 items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
});

/**
 * Map view that switches between Google Maps (when MAP_PROVIDER=google) and
 * OpenStreetMap/Leaflet (the fallback). Hospital markers are derived from
 * backend hospital coordinates.
 */
export default function MapView({
  latitude,
  longitude,
  markers = [],
}: {
  latitude: number;
  longitude: number;
  markers?: MapMarker[];
}) {
  const isGoogle = publicEnv.NEXT_PUBLIC_MAP_PROVIDER === "google";

  if (isGoogle) {
    return <GoogleMapView latitude={latitude} longitude={longitude} markers={markers} />;
  }

  return <LeafletMapView latitude={latitude} longitude={longitude} markers={markers} />;
}
