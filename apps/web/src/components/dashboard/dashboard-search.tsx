"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, SearchX, X } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useGeolocation } from "@/hooks/use-geolocation";
import { getBrowserApiClient } from "@/lib/api-browser";
import { publicEnv } from "@/lib/env";

export function DashboardSearch({ radiusKm = 5 }: { radiusKm?: number }) {
  const { coords } = useGeolocation();
  const inputId = useId();
  const typeId = useId();
  const [term, setTerm] = useState("");
  const [type, setType] = useState<"hospital" | "pharmacy">("hospital");
  const [submitted, setSubmitted] = useState("");
  const [nonce, setNonce] = useState(0);

  const search = useQuery({
    queryKey: [
      "dashboard-search",
      submitted,
      type,
      nonce,
      coords?.latitude,
      coords?.longitude,
      radiusKm,
    ],
    enabled: submitted.length > 0 && coords !== null,
    retry: false,
    queryFn: () =>
      getBrowserApiClient().map.searchPlaces({
        query: submitted,
        latitude: coords!.latitude,
        longitude: coords!.longitude,
        radiusKm,
        type,
      }),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (term.trim()) {
      setSubmitted(term.trim());
      setNonce((value) => value + 1);
    }
  }

  function reset() {
    setSubmitted("");
    setTerm("");
  }

  const places = search.data?.places ?? [];

  return (
    <div className="relative w-full">
      <form onSubmit={submit} className="flex items-center gap-2" role="search">
        <label htmlFor={inputId} className="sr-only">
          Search hospitals and pharmacies near you
        </label>
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            id={inputId}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search hospitals or pharmacies near you"
            className="h-10 bg-card pl-9"
            autoComplete="off"
          />
        </div>
        <label htmlFor={typeId} className="sr-only">
          Search category
        </label>
        <select
          id={typeId}
          value={type}
          onChange={(event) => setType(event.target.value as "hospital" | "pharmacy")}
          className="h-10 rounded-lg border border-input bg-card px-2 text-sm"
        >
          <option value="hospital">Hospitals</option>
          <option value="pharmacy">Pharmacies</option>
        </select>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="h-10 shrink-0 px-3"
          disabled={term.trim().length === 0}
          aria-label="Search places"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
        </Button>
      </form>

      {submitted.length > 0 ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-lg">
          <div className="mb-2 flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {type === "hospital" ? "Hospital" : "Pharmacy"} search
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label="Close search results"
            >
              <X aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>

          {coords === null ? (
            <p className="text-sm text-muted-foreground">
              Set your location first so results are limited to places near you.
            </p>
          ) : publicEnv.NEXT_PUBLIC_MAP_PROVIDER !== "google" ? (
            <p className="text-sm text-muted-foreground">
              Provider search is not connected in this build. Hospital and pharmacy results appear
              only when a places provider is configured.
            </p>
          ) : search.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Searching near your location…
            </p>
          ) : search.isError ? (
            <p className="text-sm text-emergency">Unable to search right now. Please try again.</p>
          ) : places.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <SearchX aria-hidden="true" className="h-4 w-4" />
              No places found for “{submitted}”. Try another term or a wider radius.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {places.length} {type === "hospital" ? "hospital" : "pharmacy"} result
                {places.length === 1 ? "" : "s"} from Google Places near you, within {radiusKm} km.
                Listings are not verified by Medicare.
              </p>
              <ul className="divide-y divide-border">
                {places.slice(0, 5).map((place) => (
                  <li key={place.placeId} className="flex items-start justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{place.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {place.formattedAddress ?? "Address not provided"}
                      </p>
                    </div>
                    <a
                      className="shrink-0 text-xs font-semibold text-primary hover:underline"
                      href={`https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open in Maps
                    </a>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">
                Doctor, medicine and test search are not connected yet, so they are not included.
              </p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
