import type { HospitalProvider, HospitalProviderDescriptor } from "./hospital-provider";

/** Explicit "no usable source" implementation. Never returns records. */
export class DisabledHospitalProvider implements HospitalProvider {
  constructor(
    private readonly requestedName: string,
    private readonly reason: string,
  ) {}

  describe(): HospitalProviderDescriptor {
    return {
      name: "disabled",
      configured: false,
      capabilities: {
        search: false,
        specialtyFilter: false,
        emergencyFilter: false,
        liveBedAvailability: false,
      },
      provenance: { source: null, license: null },
      sync: { strategy: "none", maxStalenessHours: null },
    };
  }

  get explanation(): string {
    return `${this.requestedName} is not available: ${this.reason}`;
  }
}
