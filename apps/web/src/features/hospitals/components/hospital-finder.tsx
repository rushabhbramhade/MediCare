"use client";

import { MapPin, Navigation, SearchX } from "lucide-react";
import { EmergencyBanner } from "@/components/shared/emergency-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/use-geolocation";
import { HospitalMap } from "@/components/maps/hospital-map";

export function HospitalFinder() {
  const { coords, status, error, requestLocation } = useGeolocation();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={requestLocation} disabled={status === "locating"}>
          <Navigation aria-hidden="true" className="h-4 w-4" />
          {status === "locating"
            ? "Finding you…"
            : coords
              ? "Update my location"
              : "Use my location"}
        </Button>
        {coords ? (
          <span className="text-sm text-muted-foreground">
            Showing an area near {coords.latitude.toFixed(2)}, {coords.longitude.toFixed(2)}
          </span>
        ) : null}
      </div>

      {error ? (
        <StatusNote variant="warning" title="Location unavailable">
          {error}
        </StatusNote>
      ) : null}

      {coords ? (
        <HospitalMap latitude={coords.latitude} longitude={coords.longitude} />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
          <MapPin aria-hidden="true" className="mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Share your location to see a map of the area. Your location stays in this browser
            session and is not saved.
          </p>
        </div>
      )}

      <StatusNote variant="info" title="Live hospital data is not connected">
        This build has no verified hospital feed, so it shows no hospitals and no bed counts. We
        will not invent availability.
      </StatusNote>

      <EmptyState
        icon={SearchX}
        title="No verified hospitals to show"
        description="When a contracted hospital data source is connected, nearby hospitals will appear here with their source and the time availability was observed."
      />

      <EmergencyBanner />
    </div>
  );
}
