"use client";

import { useQuery } from "@tanstack/react-query";
import { LocateFixed, MapPin, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseManualCoordinates } from "@/features/hospitals/hospital-view-state";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getBrowserApiClient } from "@/lib/api-browser";
import { publicEnv } from "@/lib/env";
import { locationErrorMessage } from "@/lib/location";
import { useLocationStore } from "@/stores/location-store";

export function DashboardLocation() {
  const { coords, status, error, requestLocation } = useGeolocation();
  const setCoords = useLocationStore((state) => state.setCoords);
  const [open, setOpen] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reverse = useQuery({
    queryKey: ["reverse-geocode", coords?.latitude, coords?.longitude],
    enabled: coords !== null && publicEnv.NEXT_PUBLIC_MAP_PROVIDER === "google",
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: () =>
      getBrowserApiClient().map.reverseGeocode(coords!.latitude, coords!.longitude),
  });

  const label =
    reverse.data?.formattedAddress ??
    (coords
      ? `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`
      : status === "denied"
        ? "Location access is disabled"
        : "Location not shared");

  const message = error ?? locationErrorMessage(status);

  async function searchAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!addressText.trim()) return;
    setFormError(null);
    setBusy(true);
    try {
      const result = await getBrowserApiClient().map.geocode(addressText.trim());
      setCoords({ latitude: result.latitude, longitude: result.longitude });
      setOpen(false);
    } catch {
      setFormError("Could not find that address. Try a more specific place.");
    } finally {
      setBusy(false);
    }
  }

  function useManualCoordinates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseManualCoordinates(latitude, longitude);
    if (!parsed.ok) {
      setFormError(parsed.message);
      return;
    }
    setFormError(null);
    setCoords({ latitude: parsed.latitude, longitude: parsed.longitude });
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="dashboard-location-panel"
        className="flex min-h-11 w-full items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-2 text-left shadow-sm transition-colors hover:bg-accent sm:px-3"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <MapPin aria-hidden="true" className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
            Current location
          </span>
          <span className="block truncate text-sm font-medium" title={label}>
            {label}
          </span>
        </span>
        <span className="hidden shrink-0 text-xs font-semibold text-primary sm:inline">
          {coords ? "Change" : "Set"}
        </span>
      </button>

      {open ? (
        <div
          id="dashboard-location-panel"
          className="absolute left-0 z-30 mt-2 max-h-[calc(100dvh-9rem)] w-[min(22rem,calc(100vw-2rem))] space-y-4 overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-lg max-sm:fixed max-sm:inset-x-4 max-sm:top-32 max-sm:mt-0 max-sm:w-auto"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Set your location</p>
              <p className="text-xs text-muted-foreground">
                Used to find hospitals near you. It is not stored on your profile.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>

          <Button
            className="w-full"
            onClick={requestLocation}
            disabled={status === "locating"}
          >
            <LocateFixed aria-hidden="true" className="h-4 w-4" />
            {status === "locating" ? "Finding you…" : "Use my current location"}
          </Button>

          {message ? (
            <p role="status" className="rounded-lg bg-amber-50 p-3 text-xs text-amber-950">
              {message}
            </p>
          ) : null}

          {publicEnv.NEXT_PUBLIC_MAP_PROVIDER === "google" ? (
            <form onSubmit={searchAddress} className="space-y-2">
              <Label htmlFor="dashboard-address">Search an address</Label>
              <div className="flex gap-2">
                <Input
                  id="dashboard-address"
                  value={addressText}
                  onChange={(event) => setAddressText(event.target.value)}
                  placeholder="Area, city or postcode"
                  autoComplete="off"
                />
                <Button type="submit" variant="outline" disabled={busy}>
                  <Search aria-hidden="true" className="h-4 w-4" />
                  {busy ? "Finding…" : "Find"}
                </Button>
              </div>
            </form>
          ) : null}

          <form onSubmit={useManualCoordinates} className="space-y-2">
            <p className="text-sm font-medium">Or enter coordinates</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="dashboard-latitude" className="text-xs">
                  Latitude
                </Label>
                <Input
                  id="dashboard-latitude"
                  inputMode="decimal"
                  placeholder="19.0760"
                  value={latitude}
                  onChange={(event) => setLatitude(event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="dashboard-longitude" className="text-xs">
                  Longitude
                </Label>
                <Input
                  id="dashboard-longitude"
                  inputMode="decimal"
                  placeholder="72.8777"
                  value={longitude}
                  onChange={(event) => setLongitude(event.target.value)}
                />
              </div>
            </div>
            {formError ? <p className="text-xs text-emergency">{formError}</p> : null}
            <Button type="submit" variant="outline" className="w-full">
              Use these coordinates
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
