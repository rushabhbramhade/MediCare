"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import { publicEnv } from "@/lib/env";

export default function MapView({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-80 w-full rounded-xl"
    >
      <TileLayer
        url={publicEnv.NEXT_PUBLIC_MAP_TILE_URL}
        attribution={publicEnv.NEXT_PUBLIC_MAP_ATTRIBUTION}
      />
      <CircleMarker
        center={[latitude, longitude]}
        radius={8}
        pathOptions={{ color: "#0f766e", fillColor: "#0f766e", fillOpacity: 0.9 }}
      >
        <Tooltip>Your approximate location</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
