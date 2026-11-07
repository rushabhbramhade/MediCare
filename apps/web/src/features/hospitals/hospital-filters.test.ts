import { describe, expect, it } from "vitest";
import {
  activeFilterCount,
  DEFAULT_HOSPITAL_FILTERS,
  isFilterActive,
  toggleFilter,
} from "./hospital-filters";

describe("hospital filters", () => {
  it("toggles boolean filters", () => {
    const next = toggleFilter(DEFAULT_HOSPITAL_FILTERS, "icuAvailable");
    expect(next.icuAvailable).toBe(true);
    expect(toggleFilter(next, "icuAvailable").icuAvailable).toBe(false);
  });

  it("keeps ownership filters mutually exclusive", () => {
    const government = toggleFilter(DEFAULT_HOSPITAL_FILTERS, "government");
    expect(government.hospitalType).toBe("government");
    const privateOnly = toggleFilter(government, "private");
    expect(privateOnly.hospitalType).toBe("private");
  });

  it("switches Nearby between 5 km and the default radius", () => {
    const near = toggleFilter(DEFAULT_HOSPITAL_FILTERS, "nearby");
    expect(near.radiusKm).toBe(5);
    expect(isFilterActive(near, "nearby")).toBe(true);
    expect(toggleFilter(near, "nearby").radiusKm).toBe(DEFAULT_HOSPITAL_FILTERS.radiusKm);
  });

  it("counts only active filters", () => {
    expect(activeFilterCount(DEFAULT_HOSPITAL_FILTERS)).toBe(0);
    const filters = toggleFilter(toggleFilter(DEFAULT_HOSPITAL_FILTERS, "emergencyOnly"), "private");
    expect(activeFilterCount(filters)).toBe(2);
  });
});
