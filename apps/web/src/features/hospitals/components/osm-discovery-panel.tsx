"use client";

import { useQuery } from "@tanstack/react-query";
import { MapPin, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusNote } from "@/components/shared/status-note";
import { getBrowserApiClient } from "@/lib/api-browser";
import type { OsmDiscoveryResponse } from "@medicare/contracts";

const RADIUS_OPTIONS_M = [1000, 2500, 5000, 10000];

interface OsmPlaceCardProps {
  place: NonNullable<OsmDiscoveryResponse["places"]>[number];
}

function OsmPlaceCard({ place }: OsmPlaceCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{place.name ?? "Unnamed place"}</h3>
          <p className="text-sm text-muted-foreground">
            {[place.addressLine, place.city, place.state, place.postalCode]
              .filter(Boolean)
              .join(", ") || "Address not provided"}
          </p>
          {place.phone ? (
            <p className="text-sm text-muted-foreground">
              {place.phone}
            </p>
          ) : null}
        </div>
        <span className="text-sm font-medium">{place.distanceKm} km</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
          {place.featureType}
        </span>
        <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded">
          Unverified
        </span>
        <span className="text-xs font-medium bg-muted px-2 py-1 rounded">
          Bed: unknown
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Source: OpenStreetMap. Last synced{" "}
        {new Date(place.lastSyncedAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export function OsmDiscoveryPanel({
  featureType,
  title,
  description,
}: {
  featureType: "hospital" | "pharmacy";
  title: string;
  description: string;
}) {
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState(5000);
  const [manualError, setManualError] = useState<string | null>(null);

  const query = useQuery<OsmDiscoveryResponse>({
    queryKey: ["osm", featureType, latitude, longitude, radiusMeters],
    enabled: latitude !== "" && longitude !== "",
    retry: false,
    queryFn: async () => {
      const client = getBrowserApiClient();
      const result = featureType === "hospital"
        ? await client.osm.searchHospitals({
            latitude: Number(latitude),
            longitude: Number(longitude),
            radiusMeters,
          })
        : await client.osm.searchPharmacies({
            latitude: Number(latitude),
            longitude: Number(longitude),
            radiusMeters,
          });
      return result;
    },
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!latitude.trim() || !longitude.trim()) {
      setManualError("Enter both latitude and longitude.");
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      setManualError("Latitude must be a number between -90 and 90.");
      return;
    }
    if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
      setManualError("Longitude must be a number between -180 and 180.");
      return;
    }
    setManualError(null);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="osm-latitude">Latitude</Label>
          <Input
            id="osm-latitude"
            inputMode="decimal"
            placeholder="e.g. 18.5204"
            value={latitude}
            onChange={(event) => setLatitude(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="osm-longitude">Longitude</Label>
          <Input
            id="osm-longitude"
            inputMode="decimal"
            placeholder="e.g. 73.8567"
            value={longitude}
            onChange={(event) => setLongitude(event.target.value)}
          />
        </div>
        <Button type="submit">Search</Button>
        {manualError ? <p className="text-sm text-emergency">{manualError}</p> : null}
      </form>

      <div className="flex items-center gap-2">
        <Label htmlFor="osm-radius">Search radius</Label>
        <select
          id="osm-radius"
          value={radiusMeters}
          onChange={(event) => setRadiusMeters(Number(event.target.value))}
          className="border border-input bg-input px-2 py-1 text-sm rounded"
        >
          {RADIUS_OPTIONS_M.map((option) => (
            <option key={option} value={option}>
              {option / 1000} km
            </option>
          ))}
        </select>
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Search aria-hidden="true" className="h-4 w-4 animate-spin" />
          Searching OpenStreetMap…
        </div>
      ) : null}

      {query.error ? (
        <StatusNote variant="warning" title="Search failed">
          {query.error instanceof Error
            ? query.error.message
            : "OpenStreetMap search failed. Please try again."}
        </StatusNote>
      ) : null}

      {query.data ? (
        query.data.places.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No results found"
            description={`No OpenStreetMap ${featureType} entries found within ${query.data.radiusMeters / 1000} km.`}
          />
        ) : (
          <section className="space-y-3" aria-label={`${title} results`}>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <MapPin aria-hidden="true" className="h-5 w-5" />
              {query.data.total} {featureType}{query.data.total === 1 ? "" : "s"}
            </h2>
            <StatusNote variant="info" title="Unverified OpenStreetMap data">
              These results come from OpenStreetMap and are not verified medical facilities.
              Bed availability, emergency capability and operational status are unknown.
            </StatusNote>
            <ul className="space-y-3">
              {query.data.places.map((place) => (
                <OsmPlaceCard key={place.id} place={place} />
              ))}
            </ul>
          </section>
        )
      ) : null}
    </div>
  );
}
