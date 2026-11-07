"use client";

import { CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";
import type { MapMarker } from "./map-view";
import { publicEnv } from "@/lib/env";

export default function LeafletMapView({
  latitude,
  longitude,
  markers = [],
}: {
  latitude: number;
  longitude: number;
  markers?: MapMarker[];
}) {
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
        <Tooltip>Search location</Tooltip>
      </CircleMarker>
      {markers.map((marker) => (
        <CircleMarker
          key={marker.id}
          center={[marker.latitude, marker.longitude]}
          radius={7}
          pathOptions={{ color: "#b91c1c", fillColor: "#b91c1c", fillOpacity: 0.8 }}
        >
          <Tooltip>{marker.label}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
