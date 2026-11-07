import { ApiClientError } from "@medicare/api-client";
import type { PatientProfile } from "@medicare/types";
import { describe, expect, it } from "vitest";
import {
  EMPTY_PROFILE_FORM,
  isProfileNotFound,
  isSessionExpired,
  profileToFormValues,
  toProfileViewState,
} from "./profile-state";

const profile: PatientProfile = {
  id: "profile-1",
  fullName: "Asha Rao",
  dateOfBirth: "1990-04-12",
  gender: "female",
  phone: "+919876543210",
  preferredLanguage: "en",
  accessibilityPreferences: ["large_text"],
  emergencyContactPhone: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
};

describe("profile view state", () => {
  it("shows loading while the profile is fetched", () => {
    expect(toProfileViewState({ isLoading: true, profile: undefined, error: null })).toEqual({
      kind: "loading",
    });
  });

  it("shows the empty state when no profile exists", () => {
    expect(toProfileViewState({ isLoading: false, profile: null, error: null })).toEqual({
      kind: "empty",
    });
  });

  it("shows the profile when loaded", () => {
    expect(toProfileViewState({ isLoading: false, profile, error: null })).toEqual({
      kind: "ready",
      profile,
    });
  });

  it("shows a retryable error for a failed load", () => {
    expect(
      toProfileViewState({
        isLoading: false,
        profile: undefined,
        error: new Error("Network unavailable"),
      }),
    ).toEqual({ kind: "error", message: "Network unavailable" });
  });

  it("detects an expired session", () => {
    const error = new ApiClientError("Unauthorized", { status: 401, code: "unauthorized" });
    expect(isSessionExpired(error)).toBe(true);
    expect(toProfileViewState({ isLoading: false, profile: undefined, error })).toEqual({
      kind: "session-expired",
    });
  });

  it("treats a missing profile response as the empty state", () => {
    const error = new ApiClientError("Not found", { status: 404, code: "profile_not_found" });
    expect(isProfileNotFound(error)).toBe(true);
    expect(toProfileViewState({ isLoading: false, profile: undefined, error })).toEqual({
      kind: "empty",
    });
  });
});

describe("profile form mapping", () => {
  it("returns empty defaults for a new profile", () => {
    expect(profileToFormValues(null)).toEqual(EMPTY_PROFILE_FORM);
  });

  it("copies stored values into the form", () => {
    const values = profileToFormValues(profile);
    expect(values.fullName).toBe("Asha Rao");
    expect(values.dateOfBirth).toBe("1990-04-12");
    expect(values.accessibilityPreferences).toEqual(["large_text"]);
    expect(values.accessibilityPreferences).not.toBe(profile.accessibilityPreferences);
  });
});
