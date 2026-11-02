"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, MapPin, Navigation, SearchX } from "lucide-react";
import { useState, type FormEvent } from "react";
import { HospitalMap } from "@/components/maps/hospital-map";
import { EmergencyBanner } from "@/components/shared/emergency-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusNote } from "@/components/shared/status-note";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getBrowserApiClient } from "@/lib/api-browser";
import { formatDateTime } from "@/lib/format";
import { locationErrorMessage } from "@/lib/location";
import { parseManualCoordinates, toHospitalViewState } from "../hospital-view-state";

const RADIUS_OPTIONS = [1, 5, 10, 25, 50];
const PAGE_SIZE = 10;

const selectClassName =
  "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground sm:text-sm";

interface SearchCenter {
  latitude: number;
  longitude: number;
}

export function HospitalFinder() {
  const { coords, status, error, requestLocation } = useGeolocation();
  const [manualCenter, setManualCenter] = useState<SearchCenter | null>(null);
  const center = manualCenter ?? coords;
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [radiusKm, setRadiusKm] = useState(10);
  const [specialty, setSpecialty] = useState("");
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [page, setPage] = useState(1);

  const searchQuery = useQuery({
    queryKey: [
      "hospitals",
      center?.latitude,
      center?.longitude,
      radiusKm,
      specialty,
      emergencyOnly,
      page,
    ],
    enabled: center !== null,
    retry: false,
    queryFn: () =>
      getBrowserApiClient().searchHospitals({
        latitude: center!.latitude,
        longitude: center!.longitude,
        radiusKm,
        specialty: specialty.trim() || undefined,
        emergencyOnly,
        page,
        pageSize: PAGE_SIZE,
      }),
  });

  const view = toHospitalViewState({
    searched: center !== null,
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
    result: searchQuery.data,
  });

  function handleManualLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseManualCoordinates(manualLatitude, manualLongitude);
    if (!parsed.ok) {
      setManualError(parsed.message);
      return;
    }
    setManualError(null);
    setManualCenter({ latitude: parsed.latitude, longitude: parsed.longitude });
    setPage(1);
  }

  function handleFilterChange<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  const markers =
    view.kind === "results"
      ? view.hospitals.map((hospital) => ({
          id: hospital.id,
          latitude: hospital.latitude,
          longitude: hospital.longitude,
          label: hospital.name,
        }))
      : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => {
            setManualCenter(null);
            setPage(1);
            requestLocation();
          }}
          disabled={status === "locating"}
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          {status === "locating"
            ? "Finding you…"
            : center
              ? "Update my location"
              : "Use my location"}
        </Button>
        {center ? (
          <span className="text-sm text-muted-foreground">
            Searching near {center.latitude.toFixed(4)}, {center.longitude.toFixed(4)}
          </span>
        ) : null}
      </div>

      {error || locationErrorMessage(status) ? (
        <StatusNote variant="warning" title="Location unavailable">
          {error ?? locationErrorMessage(status)}
        </StatusNote>
      ) : null}

      <form
        onSubmit={handleManualLocation}
        className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="manual-latitude">Latitude</Label>
          <Input
            id="manual-latitude"
            inputMode="decimal"
            placeholder="e.g. 19.0760"
            value={manualLatitude}
            onChange={(event) => setManualLatitude(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-longitude">Longitude</Label>
          <Input
            id="manual-longitude"
            inputMode="decimal"
            placeholder="e.g. 72.8777"
            value={manualLongitude}
            onChange={(event) => setManualLongitude(event.target.value)}
          />
        </div>
        <Button type="submit" variant="outline">
          Use these coordinates
        </Button>
        {manualError ? <p className="text-sm text-emergency sm:col-span-3">{manualError}</p> : null}
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="radius">Search radius</Label>
          <select
            id="radius"
            className={selectClassName}
            value={radiusKm}
            onChange={(event) => handleFilterChange(setRadiusKm, Number(event.target.value))}
          >
            {RADIUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option} km
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialty">Specialty (optional)</Label>
          <Input
            id="specialty"
            placeholder="e.g. cardiology"
            value={specialty}
            onChange={(event) => handleFilterChange(setSpecialty, event.target.value)}
          />
        </div>
        <label className="flex items-center gap-3 self-end rounded-lg border border-border bg-card px-3 py-3 text-sm">
          <input
            type="checkbox"
            checked={emergencyOnly}
            onChange={(event) => handleFilterChange(setEmergencyOnly, event.target.checked)}
            className="h-4 w-4"
          />
          Emergency services only
        </label>
      </div>

      {center ? (
        <HospitalMap latitude={center.latitude} longitude={center.longitude} markers={markers} />
      ) : (
        <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
          <MapPin aria-hidden="true" className="mb-3 h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Share your location or enter coordinates to search. Your location stays in this browser
            session and is not saved.
          </p>
        </div>
      )}

      {view.kind === "idle" ? (
        <StatusNote variant="info" title="No search yet">
          Share your location or enter coordinates. Results only appear when a licensed hospital
          provider is configured.
        </StatusNote>
      ) : null}

      {view.kind === "loading" ? (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          Searching verified hospital records…
        </div>
      ) : null}

      {view.kind === "session-expired" ? (
        <StatusNote variant="warning" title="Your session expired">
          <a className="font-medium underline underline-offset-4" href="/login">
            Sign in again
          </a>{" "}
          to search for hospitals.
        </StatusNote>
      ) : null}

      {view.kind === "error" ? (
        <div className="space-y-3">
          <StatusNote variant="warning" title="Hospital search failed">
            {view.message}
          </StatusNote>
          <Button variant="outline" onClick={() => void searchQuery.refetch()}>
            Try again
          </Button>
        </div>
      ) : null}

      {view.kind === "no-source" ? (
        <>
          <StatusNote variant="info" title="Live hospital data is not configured">
            {view.message}
          </StatusNote>
          <EmptyState
            icon={SearchX}
            title="No verified hospitals to show"
            description="Medicare will not invent hospitals, distances or bed counts. This screen stays empty until a licensed source is connected."
          />
        </>
      ) : null}

      {view.kind === "empty" ? (
        <EmptyState
          icon={SearchX}
          title="No verified hospitals found"
          description={`No verified hospital records exist within ${view.radiusKm} km. Try a wider radius or a different location.`}
        />
      ) : null}

      {view.kind === "results" ? (
        <section className="space-y-4" aria-labelledby="hospital-results">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="hospital-results" className="text-lg font-semibold">
              {view.meta.total} verified hospital{view.meta.total === 1 ? "" : "s"}
            </h2>
            {view.meta.source ? <Badge variant="outline">Source: {view.meta.source}</Badge> : null}
            <Badge variant="outline">Updated {formatDateTime(view.meta.generatedAt)}</Badge>
            {view.meta.maxStalenessHours !== null ? (
              <Badge variant="outline">Stale after {view.meta.maxStalenessHours} h</Badge>
            ) : null}
          </div>

          <p className="text-sm text-muted-foreground">
            Distances are straight-line kilometres from your search point. Bed and ICU availability
            is unknown because no live source is connected.
          </p>

          <ul className="space-y-3">
            {view.hospitals.map((hospital) => (
              <li
                key={hospital.id}
                className="rounded-xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{hospital.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {[hospital.addressLine, hospital.city, hospital.state, hospital.postalCode]
                        .filter(Boolean)
                        .join(", ") || "Address not provided by source"}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{hospital.distanceKm} km</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant={hospital.hasEmergency === true ? "emergency" : "outline"}>
                    {hospital.hasEmergency === true
                      ? "Emergency services"
                      : hospital.hasEmergency === false
                        ? "No emergency services listed"
                        : "Emergency services unknown"}
                  </Badge>
                  <Badge variant="outline">
                    {hospital.isStale ? "Data may be stale" : "Verified by source"}
                  </Badge>
                  <Badge variant="outline">Bed availability unknown</Badge>
                </div>

                {hospital.specialties.length > 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Specialties: {hospital.specialties.join(", ")}
                  </p>
                ) : null}

                <p className="mt-2 text-xs text-muted-foreground">
                  Source: {hospital.source}. Last synced {formatDateTime(hospital.lastSyncedAt)}.
                </p>
              </li>
            ))}
          </ul>

          {view.meta.total > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handleFilterChange(setPage, page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {Math.max(1, Math.ceil(view.meta.total / PAGE_SIZE))}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page * PAGE_SIZE >= view.meta.total}
                onClick={() => handleFilterChange(setPage, page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      <StatusNote variant="info" title="What this screen will not do">
        Medicare does not show invented bed counts, ICU availability, ratings or distances. Unknown
        data stays labelled unknown until a licensed source provides it.
      </StatusNote>

      <EmergencyBanner />
    </div>
  );
}
