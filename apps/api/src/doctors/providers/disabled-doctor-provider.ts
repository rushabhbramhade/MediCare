import type { DoctorProvider, DoctorProviderDescriptor } from "./doctor-provider";

/** Explicit "no usable source" implementation. Never returns records. */
export class DisabledDoctorProvider implements DoctorProvider {
  constructor(
    private readonly requestedName: string,
    private readonly reason: string,
  ) {}

  describe(): DoctorProviderDescriptor {
    return {
      name: "disabled",
      configured: false,
      capabilities: {
        search: false,
        specialtyFilter: false,
        bookingLinks: false,
      },
      provenance: { source: null, license: null },
      sync: { strategy: "none", maxStalenessHours: null },
    };
  }

  get explanation(): string {
    return `${this.requestedName} is not available: ${this.reason}`;
  }
}
