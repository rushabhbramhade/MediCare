export interface DoctorProviderCapabilities {
  search: boolean;
  specialtyFilter: boolean;
  bookingLinks: boolean;
}

export interface DoctorProviderDescriptor {
  /** Provider id persisted on every doctor row. */
  name: string;
  /** False means no usable credentials/contract; callers must not query. */
  configured: boolean;
  capabilities: DoctorProviderCapabilities;
  provenance: {
    source: string | null;
    license: string | null;
  };
  sync: {
    strategy: "none" | "manual" | "scheduled" | "webhook";
    maxStalenessHours: number | null;
  };
}

/**
 * Adapter boundary for licensed doctor directories and authorised doctor APIs.
 * Implementations may fetch and normalise records, but they must never invent
 * a doctor, a qualification, a rating or an availability slot.
 */
export interface DoctorProvider {
  describe(): DoctorProviderDescriptor;
}
