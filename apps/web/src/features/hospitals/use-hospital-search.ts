"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { HospitalSearchResponse } from "@medicare/types";
import { getBrowserApiClient } from "@/lib/api-browser";
import type { Coordinates } from "@/stores/location-store";
import type { HospitalFilters } from "./hospital-filters";

export interface HospitalBounds {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export function boundsToQuery(bounds: HospitalBounds): string {
  return `${bounds.minLng},${bounds.minLat},${bounds.maxLng},${bounds.maxLat}`;
}

export function useHospitalSearch({
  center,
  query,
  filters,
  bbox,
  page,
  pageSize,
  enabled = true,
}: {
  center: Coordinates | null;
  query: string;
  filters: HospitalFilters;
  bbox: string | null;
  page: number;
  pageSize: number;
  enabled?: boolean;
}) {
  return useQuery<HospitalSearchResponse>({
    queryKey: ["hospitals", center, query, filters, bbox, page, pageSize],
    enabled: enabled && center !== null,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: ({ signal }) =>
      getBrowserApiClient().searchHospitals(
        {
          latitude: center!.latitude,
          longitude: center!.longitude,
          q: query.trim() || undefined,
          bbox: bbox ?? undefined,
          radiusKm: filters.radiusKm,
          specialty: filters.specialty.trim() || undefined,
          emergencyOnly: filters.emergencyOnly || undefined,
          availableBeds: filters.availableBeds || undefined,
          icuAvailable: filters.icuAvailable || undefined,
          open24x7: filters.open24x7 || undefined,
          ambulanceAvailable: filters.ambulanceAvailable || undefined,
          hospitalType: filters.hospitalType ?? undefined,
          page,
          pageSize,
        },
        { signal },
      ),
  });
}
