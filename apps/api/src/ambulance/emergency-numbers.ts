export interface AmbulanceEmergencyNumber {
  number: string;
  name: string;
  description: string;
  coverage: string;
  type: "national" | "state";
}

export interface AmbulanceEmergencyResponse {
  numbers: AmbulanceEmergencyNumber[];
  source: "public";
  lastVerifiedAt: string;
  disclaimer: string;
}

const EMERGENCY_NUMBERS: AmbulanceEmergencyNumber[] = [
  {
    number: "112",
    name: "India Emergency Response System",
    description: "National single emergency number for police, fire and ambulance",
    coverage: "All India",
    type: "national",
  },
  {
    number: "108",
    name: "Emergency Medical Services (108)",
    description: "State-specific ambulance service; operates in most Indian states",
    coverage: "State-specific",
    type: "state",
  },
];

/**
 * Returns public emergency contact numbers.
 * These are public information — not a provider integration.
 * Medicare does not dispatch or track ambulances.
 */
export function getEmergencyNumbers(): AmbulanceEmergencyResponse {
  return {
    numbers: EMERGENCY_NUMBERS,
    source: "public",
    lastVerifiedAt: new Date().toISOString(),
    disclaimer:
      "Calling a number is not an ambulance booking. Medicare does not dispatch or track " +
      "ambulances. 108 operates in many states but not everywhere; if it does not connect, call 112.",
  };
}
