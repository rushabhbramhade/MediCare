"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  ACCESSIBILITY_PREFERENCES,
  GENDERS,
  SUPPORTED_LANGUAGES,
  type AccessibilityPreference,
  type Gender,
} from "@medicare/types";
import {
  patientProfilePutSchema,
  type PatientProfilePutFormInput,
  type PatientProfilePutInput,
} from "@medicare/validators";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getBrowserApiClient } from "@/lib/api-browser";
import { formatPhoneDisplay } from "@/lib/format";
import {
  isProfileNotFound,
  isSessionExpired,
  profileToFormValues,
  toProfileViewState,
} from "../profile-state";

const GENDER_LABELS: Record<Gender, string> = {
  female: "Female",
  male: "Male",
  other: "Other",
  prefer_not_to_say: "Prefer not to say",
};

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  en: "English",
  hi: "हिन्दी (Hindi)",
};

const ACCESSIBILITY_LABELS: Record<AccessibilityPreference, string> = {
  large_text: "Larger text",
  high_contrast: "High contrast",
  screen_reader: "Screen reader support",
  reduced_motion: "Reduced motion",
};

const selectClassName =
  "flex h-11 w-full rounded-lg border border-input bg-card px-3 py-2 text-base text-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";

export function ProfileForm({ verifiedPhone }: { verifiedPhone?: string }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["patient-profile"],
    queryFn: async () => {
      try {
        return (await getBrowserApiClient().patientProfile.get()).profile;
      } catch (error) {
        if (isProfileNotFound(error)) return null;
        throw error;
      }
    },
    retry: false,
  });

  const view = toProfileViewState({
    isLoading: profileQuery.isLoading,
    profile: profileQuery.data,
    error: profileQuery.error,
  });

  const form = useForm<PatientProfilePutFormInput, unknown, PatientProfilePutInput>({
    resolver: zodResolver(patientProfilePutSchema),
    defaultValues: profileToFormValues(null),
  });

  useEffect(() => {
    form.reset(profileToFormValues(profileQuery.data));
  }, [form, profileQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: PatientProfilePutInput) => {
      const api = getBrowserApiClient();
      const response = profileQuery.data
        ? await api.patientProfile.patch(values)
        : await api.patientProfile.put(values);
      return response.profile;
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["patient-profile"], profile);
      setSaved(true);
    },
    onError: (error) => {
      if (isSessionExpired(error)) {
        window.location.assign("/login?expired=1");
      }
    },
  });

  const accessibility = form.watch("accessibilityPreferences") ?? [];

  if (view.kind === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Loading your profile…
      </div>
    );
  }

  if (view.kind === "session-expired") {
    return (
      <StatusNote variant="warning" title="Your session expired">
        Sign in again to load or change your profile.{" "}
        <a className="font-medium underline underline-offset-4" href="/login">
          Go to sign in
        </a>
      </StatusNote>
    );
  }

  if (view.kind === "error") {
    return (
      <div className="space-y-3">
        <StatusNote variant="warning" title="We could not load your profile">
          {view.message}
        </StatusNote>
        <Button variant="outline" onClick={() => void profileQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const isNew = view.kind === "empty";

  function onSubmit(values: PatientProfilePutInput) {
    setSaved(false);
    saveMutation.mutate(values);
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {isNew ? (
        <StatusNote variant="info" title="No profile details yet">
          Add your name and preferences. Your mobile number comes from your verified sign-in and is
          not editable here.
        </StatusNote>
      ) : null}

      {saved ? (
        <StatusNote variant="success" title="Profile saved">
          Your changes are stored in Medicare and recorded in the audit log.
        </StatusNote>
      ) : null}

      {saveMutation.isError && !isSessionExpired(saveMutation.error) ? (
        <StatusNote variant="warning" title="Could not save your profile">
          {saveMutation.error instanceof Error
            ? saveMutation.error.message
            : "Please try again in a moment."}
        </StatusNote>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            autoComplete="name"
            aria-invalid={form.formState.errors.fullName ? true : undefined}
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName ? (
            <p className="text-sm text-emergency">{form.formState.errors.fullName.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth (optional)</Label>
          <Input
            id="dateOfBirth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            aria-invalid={form.formState.errors.dateOfBirth ? true : undefined}
            {...form.register("dateOfBirth")}
          />
          {form.formState.errors.dateOfBirth ? (
            <p className="text-sm text-emergency">{form.formState.errors.dateOfBirth.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender (optional)</Label>
          <select id="gender" className={selectClassName} {...form.register("gender")}>
            <option value="">Not specified</option>
            {GENDERS.map((gender) => (
              <option key={gender} value={gender}>
                {GENDER_LABELS[gender]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="preferredLanguage">Preferred language</Label>
          <select
            id="preferredLanguage"
            className={selectClassName}
            {...form.register("preferredLanguage")}
          >
            {SUPPORTED_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {LANGUAGE_LABELS[language]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="verifiedPhone">Mobile number</Label>
          <Input
            id="verifiedPhone"
            value={verifiedPhone ? formatPhoneDisplay(verifiedPhone) : "Not provided"}
            readOnly
            aria-describedby="verifiedPhone-help"
          />
          <p id="verifiedPhone-help" className="text-sm text-muted-foreground">
            Taken from your verified sign-in. Change it through your account provider.
          </p>
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Accessibility preferences</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {ACCESSIBILITY_PREFERENCES.map((preference) => {
            const checked = accessibility.includes(preference);
            return (
              <label
                key={preference}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    const current = form.getValues("accessibilityPreferences") ?? [];
                    form.setValue(
                      "accessibilityPreferences",
                      event.target.checked
                        ? [...current, preference]
                        : current.filter((item) => item !== preference),
                      { shouldValidate: true },
                    );
                  }}
                  className="h-4 w-4"
                />
                {ACCESSIBILITY_LABELS[preference]}
              </label>
            );
          })}
        </div>
      </fieldset>

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
        ) : (
          <Save aria-hidden="true" className="h-4 w-4" />
        )}
        {saveMutation.isPending ? "Saving…" : isNew ? "Create profile" : "Save changes"}
      </Button>
    </form>
  );
}
