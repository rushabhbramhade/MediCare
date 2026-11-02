import { ApiClientError } from "@medicare/api-client";
import type { HospitalSearchResponse, HospitalSummary } from "@medicare/types";

export const NO_DATA_SOURCE_MESSAGE =
  "Live hospital data is not configured. No licensed provider is connected, so no hospitals, distances or bed availability can be shown.";

export type HospitalViewState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "session-expired" }
  | { kind: "error"; message: string }
  | { kind: "no-source"; message: string }
  | { kind: "empty"; radiusKm: number }
  | {
      kind: "results";
      hospitals: HospitalSummary[];
      meta: HospitalSearchResponse["meta"];
    };

export function toHospitalViewState(input: {
  searched: boolean;
  isLoading: boolean;
  error: unknown;
  result: HospitalSearchResponse | undefined;
}): HospitalViewState {
  if (!input.searched) return { kind: "idle" };
  if (input.isLoading) return { kind: "loading" };

  if (input.error) {
    if (input.error instanceof ApiClientError && input.error.status === 401) {
      return { kind: "session-expired" };
    }
    return {
      kind: "error",
      message:
        input.error instanceof Error
          ? input.error.message
          : "Hospital search failed. Please try again.",
    };
  }

  if (!input.result) return { kind: "loading" };

  if (input.result.status === "NO_DATA_SOURCE_CONFIGURED") {
    return { kind: "no-source", message: NO_DATA_SOURCE_MESSAGE };
  }

  if (input.result.data.length === 0) {
    return { kind: "empty", radiusKm: input.result.meta.radiusKm };
  }

  return {
    kind: "results",
    hospitals: input.result.data,
    meta: input.result.meta,
  };
}

export function parseManualCoordinates(
  latitudeText: string,
  longitudeText: string,
): { ok: true; latitude: number; longitude: number } | { ok: false; message: string } {
  const latitude = Number(latitudeText);
  const longitude = Number(longitudeText);

  if (latitudeText.trim() === "" || longitudeText.trim() === "") {
    return { ok: false, message: "Enter both a latitude and a longitude." };
  }
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return { ok: false, message: "Latitude must be a number between -90 and 90." };
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { ok: false, message: "Longitude must be a number between -180 and 180." };
  }
  return { ok: true, latitude, longitude };
}
