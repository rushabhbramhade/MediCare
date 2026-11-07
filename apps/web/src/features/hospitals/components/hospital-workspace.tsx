"use client";

import type { HospitalSearchResponse } from "@medicare/types";
import {
  AlertTriangle,
  Loader2,
  LocateFixed,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  ShieldAlert,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGeolocation } from "@/hooks/use-geolocation";
import { locationErrorMessage } from "@/lib/location";
import { cn } from "@/lib/utils";
import type { Coordinates } from "@/stores/location-store";
import { parseManualCoordinates, toHospitalViewState } from "../hospital-view-state";
import {
  DEFAULT_HOSPITAL_FILTERS,
  type HospitalFilters,
} from "../hospital-filters";
import { boundsToQuery, useHospitalSearch, type HospitalBounds } from "../use-hospital-search";
import { HospitalCard } from "./hospital-card";
import { HospitalDetailsDrawer } from "./hospital-details-drawer";
import { HospitalFilterChips } from "./hospital-filter-chips";

const PAGE_SIZE = 12;

const HospitalMap = dynamic(
  () => import("@/components/maps/hospital-map").then((mod) => mod.HospitalMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-[420px] items-center justify-center bg-muted text-sm text-muted-foreground">
        Loading OpenStreetMap…
      </div>
    ),
  },
);

function locationLabel(center: Coordinates | null): string {
  return center
    ? `${center.latitude.toFixed(4)}, ${center.longitude.toFixed(4)}`
    : "Location not shared";
}

function HospitalListSkeleton() {
  return (
    <div className="space-y-3 p-4" aria-label="Loading hospitals">
      {[0, 1, 2].map((item) => (
        <div key={item} className="animate-pulse rounded-xl border border-border p-4">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="mt-2 h-3 w-full rounded bg-muted" />
          <div className="mt-4 h-16 rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

export function HospitalWorkspace() {
  const { coords, status, error: locationError, requestLocation } = useGeolocation();
  const [manualCenter, setManualCenter] = useState<Coordinates | null>(null);
  const center = manualCenter ?? coords;

  const [queryText, setQueryText] = useState("");
  const debouncedQuery = useDebouncedValue(queryText, 350);
  const [filters, setFilters] = useState<HospitalFilters>(DEFAULT_HOSPITAL_FILTERS);
  const [page, setPage] = useState(1);
  const [bbox, setBbox] = useState<string | null>(null);
  const [liveBounds, setLiveBounds] = useState<HospitalBounds | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [manualOpen, setManualOpen] = useState(false);
  const [manualLatitude, setManualLatitude] = useState("");
  const [manualLongitude, setManualLongitude] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);

  const search = useHospitalSearch({
    center,
    query: debouncedQuery,
    filters,
    bbox,
    page,
    pageSize: PAGE_SIZE,
  });

  const view = toHospitalViewState({
    searched: center !== null,
    isLoading: search.isLoading,
    error: search.error,
    result: search.data,
  });

  const meta: HospitalSearchResponse["meta"] | null = search.data?.meta ?? null;
  const maxStalenessHours = meta?.maxStalenessHours ?? null;
  const hospitals = search.data?.data ?? [];
  const selectedHospital = selectedId
    ? (hospitals.find((hospital) => hospital.id === selectedId) ?? null)
    : null;
  const emergencyMode = filters.emergencyOnly;
  const pageCount = meta ? Math.max(1, Math.ceil(meta.total / PAGE_SIZE)) : 1;

  // Keep the selected marker's card visible when selection comes from the map.
  useEffect(() => {
    if (!selectedId) return;
    document
      .getElementById(`hospital-card-${selectedId}`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  function updateFilters(next: HospitalFilters) {
    setFilters(next);
    setPage(1);
  }

  function useDeviceLocation() {
    setManualCenter(null);
    setBbox(null);
    setPage(1);
    requestLocation();
  }

  function submitManualLocation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseManualCoordinates(manualLatitude, manualLongitude);
    if (!parsed.ok) {
      setManualError(parsed.message);
      return;
    }
    setManualError(null);
    setManualCenter({ latitude: parsed.latitude, longitude: parsed.longitude });
    setBbox(null);
    setPage(1);
    setManualOpen(false);
  }

  const locationMessage =
    locationError ?? (center ? null : locationErrorMessage(status));

  const statusLine = useMemo(() => {
    if (!center) return "Share a location to search";
    if (bbox) return "Hospitals inside the current map area";
    return `Within ${filters.radiusKm} km of ${locationLabel(center)}`;
  }, [bbox, center, filters.radiusKm]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
        <Button
          size="sm"
          variant={center ? "outline" : "default"}
          onClick={useDeviceLocation}
          disabled={status === "locating"}
        >
          <LocateFixed aria-hidden="true" className="h-4 w-4" />
          {status === "locating"
            ? "Finding you…"
            : center
              ? "Use my current location"
              : "Use my location"}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setManualOpen((value) => !value)}
          aria-expanded={manualOpen}
        >
          <MapPin aria-hidden="true" className="h-4 w-4" />
          Enter coordinates
        </Button>

        <span className="text-xs text-muted-foreground">{locationLabel(center)}</span>

        {bbox ? (
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            onClick={() => {
              setBbox(null);
              setPage(1);
            }}
          >
            <X aria-hidden="true" className="h-4 w-4" />
            Clear area filter
          </Button>
        ) : null}
      </div>

      {manualOpen ? (
        <form
          onSubmit={submitManualLocation}
          className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium">Latitude</span>
            <Input
              inputMode="decimal"
              value={manualLatitude}
              onChange={(event) => setManualLatitude(event.target.value)}
              placeholder="19.0760"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium">Longitude</span>
            <Input
              inputMode="decimal"
              value={manualLongitude}
              onChange={(event) => setManualLongitude(event.target.value)}
              placeholder="72.8777"
            />
          </label>
          <Button type="submit" variant="outline">
            Use these coordinates
          </Button>
          {manualError ? (
            <p className="text-sm text-emergency sm:col-span-3">{manualError}</p>
          ) : null}
        </form>
      ) : null}

      {locationMessage && !center ? (
        <StatusNote variant="warning" title="Location unavailable">
          {locationMessage} You can enter coordinates manually to search a specific area.
        </StatusNote>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)]">
        <section className="order-2 flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm lg:order-1 lg:h-[calc(100dvh-15rem)]">
          <div className="space-y-3 border-b border-border p-3">
            <div className="relative">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={queryText}
                onChange={(event) => {
                  setQueryText(event.target.value);
                  setPage(1);
                }}
                placeholder="Search hospitals, localities, addresses…"
                aria-label="Search hospitals"
                className="pl-9 pr-9"
              />
              {queryText ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setQueryText("");
                    setPage(1);
                  }}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <X aria-hidden="true" className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            <HospitalFilterChips filters={filters} onChange={updateFilters} />

            <button
              type="button"
              onClick={() => updateFilters({ ...filters, emergencyOnly: !emergencyMode })}
              aria-pressed={emergencyMode}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                emergencyMode
                  ? "border-emergency bg-emergency/10 text-emergency"
                  : "border-border hover:bg-accent",
              )}
            >
              <span className="inline-flex items-center gap-2">
                <ShieldAlert aria-hidden="true" className="h-4 w-4" />
                Emergency mode
              </span>
              <span className="text-xs font-normal">
                {emergencyMode ? "Showing emergency departments" : "Filter to emergency care"}
              </span>
            </button>
          </div>

          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <span
                aria-hidden="true"
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  meta?.source ? "bg-emerald-500" : "bg-muted-foreground",
                )}
              />
              <span className="truncate">
                {meta ? `${meta.total} facilit${meta.total === 1 ? "y" : "ies"} found` : "No search yet"}
                {center ? ` · ${statusLine}` : ""}
              </span>
            </span>
            {search.isFetching ? (
              <Loader2 aria-hidden="true" className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : null}
          </div>

          {emergencyMode ? (
            <div className="shrink-0 border-b border-emergency/20 bg-emergency/5 px-3 py-2 text-xs">
              <p className="font-medium text-emergency">
                Emergency mode only shows hospitals with a verified emergency department.
              </p>
              <p className="mt-1 text-muted-foreground">
                Life-threatening emergency?{" "}
                <a className="font-semibold text-emergency underline" href="tel:112">
                  Call 112
                </a>
                . Ambulance service, where it operates:{" "}
                <a className="font-semibold text-emergency underline" href="tel:108">
                  Call 108
                </a>
                . Medicare does not dispatch or track ambulances.
              </p>
            </div>
          ) : null}

          {meta?.source === "dev-sample" ? (
            <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
              <span className="inline-flex items-center gap-1 font-semibold">
                <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                Development sample data
              </span>{" "}
              These records are seeded samples, not live hospital information.
            </div>
          ) : null}

          <div className="flex-1 lg:overflow-y-auto">
            {view.kind === "idle" ? (
              <div className="p-6 text-center">
                <MapPin
                  aria-hidden="true"
                  className="mx-auto mb-2 h-8 w-8 text-muted-foreground"
                />
                <p className="font-medium">Set a location to see hospitals</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Medicare does not guess a city. Share your location or enter coordinates.
                </p>
              </div>
            ) : null}

            {view.kind === "loading" ? <HospitalListSkeleton /> : null}

            {view.kind === "session-expired" ? (
              <div className="p-4">
                <StatusNote variant="warning" title="Your session expired">
                  <a className="font-medium underline" href="/login">
                    Sign in again
                  </a>{" "}
                  to search for hospitals.
                </StatusNote>
              </div>
            ) : null}

            {view.kind === "error" ? (
              <div className="space-y-3 p-4">
                <StatusNote variant="warning" title="Hospital search failed">
                  {view.message}
                </StatusNote>
                <Button variant="outline" size="sm" onClick={() => void search.refetch()}>
                  <RefreshCw aria-hidden="true" className="h-4 w-4" />
                  Try again
                </Button>
              </div>
            ) : null}

            {view.kind === "no-source" ? (
              <div className="space-y-3 p-4">
                <StatusNote variant="info" title="Live hospital data is not configured">
                  {view.message}
                </StatusNote>
                <EmptyState
                  icon={SearchX}
                  title="No verified hospitals to show"
                  description="Medicare will not invent hospitals, distances or bed counts. This screen stays empty until a licensed source is connected."
                />
              </div>
            ) : null}

            {view.kind === "empty" ? (
              <div className="p-4">
                <EmptyState
                  icon={SearchX}
                  title="No hospitals match"
                  description="No verified records match these filters in this area. Widen the radius, clear a filter, or search a different location."
                />
              </div>
            ) : null}

            {view.kind === "results" ? (
              <ul className="space-y-3 p-3">
                {view.hospitals.map((hospital) => (
                  <li key={hospital.id} id={`hospital-card-${hospital.id}`}>
                    <HospitalCard
                      hospital={hospital}
                      maxStalenessHours={view.meta.maxStalenessHours}
                      selected={hospital.id === selectedId}
                      onSelect={() =>
                        setSelectedId((current) =>
                          current === hospital.id ? null : hospital.id,
                        )
                      }
                      origin={center}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {view.kind === "results" && view.meta.total > PAGE_SIZE ? (
            <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border p-2.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {pageCount}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>

        <section className="relative order-1 min-h-[420px] overflow-hidden rounded-xl border border-border bg-muted shadow-sm lg:order-2 lg:h-[calc(100dvh-15rem)]">
          {center ? (
            <>
              <HospitalMap
                center={center}
                hospitals={hospitals}
                selectedId={selectedId}
                onSelect={(id) =>
                  setSelectedId((current) => (current === id ? null : id))
                }
                onBoundsChange={setLiveBounds}
                className="min-h-[420px]"
              />

              <button
                type="button"
                disabled={!liveBounds}
                onClick={() => {
                  if (!liveBounds) return;
                  setBbox(boundsToQuery(liveBounds));
                  setPage(1);
                }}
                className="absolute left-3 top-3 z-[1000] inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold shadow-lg transition-colors hover:bg-accent disabled:opacity-60"
              >
                <RefreshCw aria-hidden="true" className="h-3.5 w-3.5 text-primary" />
                {bbox ? "Search this area again" : "Search this area"}
              </button>

              {selectedHospital ? (
                <HospitalDetailsDrawer
                  hospital={selectedHospital}
                  maxStalenessHours={maxStalenessHours}
                  origin={center}
                  onClose={() => setSelectedId(null)}
                />
              ) : null}
            </>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center px-6 text-center">
              <MapPin
                aria-hidden="true"
                className="mb-3 h-10 w-10 text-muted-foreground"
              />
              <p className="font-medium">The map appears after you share a location</p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                No default city is used. Your coordinates stay in this browser session.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
