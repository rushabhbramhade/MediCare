import type { DashboardHospital } from "@medicare/contracts";
import type { ResourceType } from "@medicare/types";

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function displayName(fullName: string | null | undefined): string | null {
  const first = fullName?.trim().split(/\s+/)[0];
  return first ? first : null;
}

export function formatDistanceKm(km: number): string {
  return `${km.toFixed(1)} km`;
}

export function hospitalAddress(hospital: DashboardHospital): string {
  return (
    [hospital.addressLine, hospital.city, hospital.state, hospital.postalCode]
      .filter(Boolean)
      .join(", ") || "Address not provided by the data source"
  );
}

const RESOURCE_LABELS: Record<ResourceType, string> = {
  general_bed: "General ward",
  icu_bed: "ICU beds",
  oxygen: "Oxygen beds",
  ventilator: "Ventilator beds",
  ambulance: "Ambulance",
};

export function resourceTypeLabel(type: string): string {
  return RESOURCE_LABELS[type as ResourceType] ?? type;
}

export function capacityStatusLabel(status: DashboardHospital["capacityStatus"]): string {
  switch (status) {
    case "AVAILABLE":
      return "Available";
    case "LIMITED":
      return "Limited";
    case "FULL":
      return "Full";
    case "STALE":
      return "Report outdated";
    default:
      return "Unknown";
  }
}
