export interface HospitalProviderCapabilities {
  search: boolean;
  specialtyFilter: boolean;
  emergencyFilter: boolean;
  liveBedAvailability: boolean;
}

export interface HospitalProviderDescriptor {
  /** Provider id persisted on every hospital row. */
  name: string;
  /** False means no usable credentials/contract; callers must not query. */
  configured: boolean;
  capabilities: HospitalProviderCapabilities;
  provenance: {
    source: string | null;
    license: string | null;
  };
  sync: {
    strategy: "none" | "manual" | "scheduled" | "webhook";
    /** Rows older than this are reported stale. Null means no window declared. */
    maxStalenessHours: number | null;
  };
}

/**
 * Adapter boundary for licensed hospital directories and authorised hospital
 * APIs. Implementations may fetch and normalise records, but they must never
 * invent a hospital, a bed count or an availability value.
 */
export interface HospitalProvider {
  describe(): HospitalProviderDescriptor;
}
