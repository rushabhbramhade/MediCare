import type {
  HospitalAvailability,
  HospitalSummary,
  HospitalType,
  ResourceType,
} from "@medicare/types";

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  general_bed: "General beds",
  icu_bed: "ICU beds",
  oxygen: "Oxygen-supported beds",
  ventilator: "Ventilators",
  ambulance: "Ambulances",
};

const HOSPITAL_TYPE_LABELS: Record<HospitalType, string> = {
  government: "Government",
  private: "Private",
  charitable: "Charitable",
  multi_specialty: "Multi-specialty",
  clinic: "Clinic",
  other: "Other",
};

export function hospitalTypeLabel(type: HospitalType | null): string | null {
  return type ? HOSPITAL_TYPE_LABELS[type] : null;
}

export function hospitalAddress(
  hospital: Pick<HospitalSummary, "addressLine" | "city" | "state" | "postalCode">,
): string {
  return (
    [hospital.addressLine, hospital.city, hospital.state, hospital.postalCode]
      .filter(Boolean)
      .join(", ") || "Address not reported"
  );
}

export interface AvailabilityView {
  report: HospitalAvailability;
  /** False when the report is past the provider freshness window or marked stale. */
  fresh: boolean;
  label: string;
}

export function reportLabel(report: HospitalAvailability): string {
  // A FULL report stays "full" even when it carries a zero quantity.
  if (report.status === "FULL") return "Reported full";
  if (report.quantity !== null) return `${report.quantity} reported available`;
  switch (report.status) {
    case "LIMITED":
      return "Reported limited";
    case "AVAILABLE":
      return "Reported available";
    case "STALE":
      return "Report may be stale";
    default:
      return "Not reported";
  }
}

/**
 * Latest non-unknown report for a resource. Returns null when nothing has been
 * reported, so the UI shows an explicit "not reported" state.
 */
export function latestReport(
  hospital: Pick<HospitalSummary, "availability">,
  resourceType: ResourceType,
  maxStalenessHours: number | null,
  now = Date.now(),
): AvailabilityView | null {
  const reports = hospital.availability
    .filter(
      (item) => item.resourceType === resourceType && item.status !== "UNKNOWN",
    )
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

  const report = reports[0];
  if (!report) return null;

  const ageMs = now - new Date(report.reportedAt).getTime();
  const fresh =
    report.verificationStatus !== "stale" &&
    (maxStalenessHours === null || ageMs <= maxStalenessHours * 3_600_000);

  return { report, fresh, label: reportLabel(report) };
}

/** OSM directions when an origin is known, otherwise the hospital on the map. */
export function directionsUrl(
  hospital: Pick<HospitalSummary, "latitude" | "longitude">,
  origin: { latitude: number; longitude: number } | null,
): string {
  if (origin) {
    const route = `${origin.latitude}%2C${origin.longitude}%3B${hospital.latitude}%2C${hospital.longitude}`;
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${route}`;
  }
  return `https://www.openstreetmap.org/?mlat=${hospital.latitude}&mlon=${hospital.longitude}#map=17/${hospital.latitude}/${hospital.longitude}`;
}

export function emergencyBadge(
  hasEmergency: boolean | null,
): { label: string; known: boolean; available: boolean } {
  if (hasEmergency === true) {
    return { label: "Emergency department", known: true, available: true };
  }
  if (hasEmergency === false) {
    return { label: "No emergency department listed", known: true, available: false };
  }
  return { label: "Emergency services not reported", known: false, available: false };
}
