import { describe, expect, it } from "vitest";
import { hospitalSearchSchema, patientProfilePatchSchema, patientProfilePutSchema } from "../index";

describe("patient profile schemas", () => {
  it("accepts a complete profile and applies defaults", () => {
    const parsed = patientProfilePutSchema.parse({
      fullName: "  Asha Rao  ",
      dateOfBirth: "1990-04-12",
      gender: "female",
      preferredLanguage: "hi",
      accessibilityPreferences: ["large_text"],
    });
    expect(parsed).toEqual({
      fullName: "Asha Rao",
      dateOfBirth: "1990-04-12",
      gender: "female",
      preferredLanguage: "hi",
      accessibilityPreferences: ["large_text"],
    });
  });

  it("defaults language and accessibility preferences", () => {
    expect(patientProfilePutSchema.parse({ fullName: "Asha Rao" })).toEqual({
      fullName: "Asha Rao",
      preferredLanguage: "en",
      accessibilityPreferences: [],
    });
  });

  it("rejects a user id in the body so ownership cannot be overridden", () => {
    const result = patientProfilePutSchema.safeParse({
      fullName: "Asha Rao",
      userId: "00000000-0000-0000-0000-000000000000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects phone in the body because it comes from the verified token", () => {
    expect(
      patientProfilePutSchema.safeParse({ fullName: "Asha Rao", phone: "+919876543210" }).success,
    ).toBe(false);
  });

  it("rejects empty names, future dates and unknown preferences", () => {
    expect(patientProfilePutSchema.safeParse({ fullName: "   " }).success).toBe(false);
    expect(
      patientProfilePutSchema.safeParse({ fullName: "Asha", dateOfBirth: "2999-01-01" }).success,
    ).toBe(false);
    expect(
      patientProfilePutSchema.safeParse({ fullName: "Asha", dateOfBirth: "2024-02-31" }).success,
    ).toBe(false);
    expect(
      patientProfilePutSchema.safeParse({
        fullName: "Asha",
        accessibilityPreferences: ["telepathy"],
      }).success,
    ).toBe(false);
  });

  it("requires at least one field for PATCH", () => {
    expect(patientProfilePatchSchema.safeParse({}).success).toBe(false);
    expect(patientProfilePatchSchema.parse({ fullName: "Asha" })).toEqual({ fullName: "Asha" });
  });
});

describe("hospital search schema", () => {
  it("coerces query strings and applies defaults", () => {
    expect(
      hospitalSearchSchema.parse({
        latitude: "19.076",
        longitude: "72.8777",
        radiusKm: "5",
        emergencyOnly: "true",
      }),
    ).toEqual({
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 5,
      emergencyOnly: true,
      page: 1,
      pageSize: 20,
    });
  });

  it("rejects missing, out-of-range and empty coordinates", () => {
    expect(hospitalSearchSchema.safeParse({ longitude: 72.8 }).success).toBe(false);
    expect(hospitalSearchSchema.safeParse({ latitude: "", longitude: 72.8 }).success).toBe(false);
    expect(hospitalSearchSchema.safeParse({ latitude: 91, longitude: 72.8 }).success).toBe(false);
    expect(hospitalSearchSchema.safeParse({ latitude: 19, longitude: 181 }).success).toBe(false);
  });

  it("rejects unsafe radii and pagination", () => {
    expect(
      hospitalSearchSchema.safeParse({ latitude: 19, longitude: 72, radiusKm: 0 }).success,
    ).toBe(false);
    expect(
      hospitalSearchSchema.safeParse({ latitude: 19, longitude: 72, radiusKm: 51 }).success,
    ).toBe(false);
    expect(hospitalSearchSchema.safeParse({ latitude: 19, longitude: 72, page: 0 }).success).toBe(
      false,
    );
    expect(
      hospitalSearchSchema.safeParse({ latitude: 19, longitude: 72, pageSize: 51 }).success,
    ).toBe(false);
  });

  it("rejects unknown query fields", () => {
    expect(
      hospitalSearchSchema.safeParse({ latitude: 19, longitude: 72, provider: "practo" }).success,
    ).toBe(false);
  });
});
