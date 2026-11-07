import { ApiClientError } from "@medicare/api-client";
import type { PatientProfile } from "@medicare/types";
import type { PatientProfilePutInput } from "@medicare/validators";

export type ProfileViewState =
  | { kind: "loading" }
  | { kind: "empty" }
  | { kind: "ready"; profile: PatientProfile }
  | { kind: "error"; message: string }
  | { kind: "session-expired" };

export const EMPTY_PROFILE_FORM: PatientProfilePutInput = {
  fullName: "",
  dateOfBirth: null,
  gender: null,
  preferredLanguage: "en",
  accessibilityPreferences: [],
  emergencyContactPhone: null,
};

export function isProfileNotFound(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === "profile_not_found";
}

export function isSessionExpired(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function profileToFormValues(
  profile: PatientProfile | null | undefined,
): PatientProfilePutInput {
  if (!profile) return { ...EMPTY_PROFILE_FORM, accessibilityPreferences: [] };
  return {
    fullName: profile.fullName,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    preferredLanguage: profile.preferredLanguage,
    accessibilityPreferences: [...profile.accessibilityPreferences],
    emergencyContactPhone: profile.emergencyContactPhone,
  };
}

export function toProfileViewState(input: {
  isLoading: boolean;
  profile: PatientProfile | null | undefined;
  error: unknown;
}): ProfileViewState {
  if (input.isLoading) return { kind: "loading" };

  if (input.error) {
    if (isSessionExpired(input.error)) return { kind: "session-expired" };
    if (isProfileNotFound(input.error)) return { kind: "empty" };
    return {
      kind: "error",
      message:
        input.error instanceof Error
          ? input.error.message
          : "We could not load your profile. Please try again.",
    };
  }

  return input.profile ? { kind: "ready", profile: input.profile } : { kind: "empty" };
}
