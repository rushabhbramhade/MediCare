import type { HospitalType } from "@medicare/types";

export interface HospitalFilters {
  emergencyOnly: boolean;
  availableBeds: boolean;
  icuAvailable: boolean;
  ambulanceAvailable: boolean;
  open24x7: boolean;
  hospitalType: HospitalType | null;
  specialty: string;
  radiusKm: number;
}

export const DEFAULT_RADIUS_KM = 10;

export const DEFAULT_HOSPITAL_FILTERS: HospitalFilters = {
  emergencyOnly: false,
  availableBeds: false,
  icuAvailable: false,
  ambulanceAvailable: false,
  open24x7: false,
  hospitalType: null,
  specialty: "",
  radiusKm: DEFAULT_RADIUS_KM,
};

export type HospitalFilterKey =
  | "emergencyOnly"
  | "availableBeds"
  | "icuAvailable"
  | "ambulanceAvailable"
  | "open24x7"
  | "government"
  | "private"
  | "nearby";

export function isFilterActive(filters: HospitalFilters, key: HospitalFilterKey): boolean {
  switch (key) {
    case "government":
      return filters.hospitalType === "government";
    case "private":
      return filters.hospitalType === "private";
    case "nearby":
      return filters.radiusKm <= 5;
    default:
      return filters[key];
  }
}

export function toggleFilter(filters: HospitalFilters, key: HospitalFilterKey): HospitalFilters {
  switch (key) {
    case "government":
      return {
        ...filters,
        hospitalType: filters.hospitalType === "government" ? null : "government",
      };
    case "private":
      return {
        ...filters,
        hospitalType: filters.hospitalType === "private" ? null : "private",
      };
    case "nearby":
      return { ...filters, radiusKm: filters.radiusKm <= 5 ? DEFAULT_RADIUS_KM : 5 };
    default:
      return { ...filters, [key]: !filters[key] };
  }
}

export function activeFilterCount(filters: HospitalFilters): number {
  return [
    filters.emergencyOnly,
    filters.availableBeds,
    filters.icuAvailable,
    filters.ambulanceAvailable,
    filters.open24x7,
    filters.hospitalType !== null,
    filters.specialty.trim() !== "",
    filters.radiusKm !== DEFAULT_RADIUS_KM,
  ].filter(Boolean).length;
}
