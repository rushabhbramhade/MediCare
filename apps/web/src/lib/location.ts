import type { LocationStatus } from "@/stores/location-store";

/** Manual entry is always offered when automatic location is unavailable. */
export function locationErrorMessage(status: LocationStatus): string | null {
  switch (status) {
    case "denied":
      return "Location permission was denied. Allow it in your browser settings or enter coordinates below.";
    case "unavailable":
      return "This browser cannot share your location. Enter coordinates below.";
    case "error":
      return "We could not get your location. Try again or enter coordinates below.";
    default:
      return null;
  }
}
