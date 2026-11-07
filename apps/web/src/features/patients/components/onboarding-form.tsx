"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { SUPPORTED_LANGUAGES } from "@medicare/types";
import {
  patientProfilePutSchema,
  type PatientProfilePutFormInput,
  type PatientProfilePutInput,
} from "@medicare/validators";
import { AlertCircle, ArrowRight, Check, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isProfileNotFound, isSessionExpired } from "@/features/patients/profile-state";
import { getBrowserApiClient } from "@/lib/api-browser";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};

export function OnboardingForm({ verifiedPhone }: { verifiedPhone?: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const form = useForm<PatientProfilePutFormInput, unknown, PatientProfilePutInput>({
    resolver: zodResolver(patientProfilePutSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: null,
      gender: null,
      preferredLanguage: "en",
      accessibilityPreferences: [],
      emergencyContactPhone: null,
    },
  });

  const preferredLanguage = form.watch("preferredLanguage");

  useEffect(() => {
    let cancelled = false;

    async function checkProfile() {
      try {
        const { profile } = await getBrowserApiClient().patientProfile.get();
        if (cancelled) return;
        if (profile?.fullName) {
          router.replace("/dashboard");
          return;
        }
      } catch (error) {
        if (cancelled) return;
        if (isSessionExpired(error)) {
          router.replace("/login?expired=1");
          return;
        }
        if (!isProfileNotFound(error)) {
          setCheckError(
            "We could not check your account. You can still complete your profile below.",
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    void checkProfile();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function save(values: PatientProfilePutInput) {
    setSaveError(null);
    setIsSaving(true);
    try {
      await getBrowserApiClient().patientProfile.put(values);
      setSaved(true);
    } catch (error) {
      if (isSessionExpired(error)) {
        router.replace("/login?expired=1");
        return;
      }
      setSaveError(
        error instanceof Error
          ? error.message
          : "We could not save your profile. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const submit = form.handleSubmit((values) => void save(values));

  function skipOptionalDetails() {
    const fullName = form.getValues("fullName").trim();
    if (!fullName) {
      router.replace("/dashboard");
      return;
    }
    void save({
      fullName,
      dateOfBirth: null,
      gender: null,
      preferredLanguage: form.getValues("preferredLanguage") ?? "en",
      accessibilityPreferences: [],
      emergencyContactPhone: null,
    });
  }

  if (saved) {
    const fullName = form.getValues("fullName").trim();
    return (
      <div className="flex flex-1 flex-col justify-center py-8" role="status" aria-live="polite">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
          <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Your Medicare account is ready
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
          {fullName ? `Welcome, ${fullName}. ` : ""}Your mobile number is verified. You can add more
          profile details any time.
        </p>
        <Button
          type="button"
          size="lg"
          className="mt-7 w-full sm:w-auto"
          onClick={() => router.replace("/dashboard")}
        >
          Go to dashboard
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Next, you can find nearby hospitals, book a doctor, or open iCare AI.
        </p>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex flex-1 items-center gap-3 py-10 text-sm text-muted-foreground">
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        Checking your account…
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-primary">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary">
            <Check aria-hidden="true" className="h-3 w-3" />
          </span>
          <span>Step 2 of 2</span>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mb-6">
          <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: "100%" }} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Let&apos;s set up your profile
        </h1>
        <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
          Only essential details needed to coordinate consultations, ambulance dispatches, and
          prescriptions.
        </p>
      </div>

      {checkError ? (
        <div role="status" className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{checkError}</span>
        </div>
      ) : null}

      <form onSubmit={submit} noValidate className="mt-7 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName">
            Full name <span className="text-destructive">*</span>
          </Label>
          <span className="text-xs text-muted-foreground">as per Aadhaar or Govt ID</span>
          <Input
            id="fullName"
            autoComplete="name"
            placeholder="e.g. Rajesh Kumar Rao"
            aria-invalid={form.formState.errors.fullName ? true : undefined}
            {...form.register("fullName")}
          />
          {form.formState.errors.fullName ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.fullName.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="dateOfBirth">
              Date of Birth <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <span className="text-xs text-muted-foreground">Helps dose calculations</span>
          </div>
          <Input
            id="dateOfBirth"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            aria-invalid={form.formState.errors.dateOfBirth ? true : undefined}
            {...form.register("dateOfBirth", {
              setValueAs: (value) => (value === "" ? null : value),
            })}
          />
          {form.formState.errors.dateOfBirth ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.dateOfBirth.message}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">Preferred Healthcare Language</legend>
          <div className="grid grid-cols-3 gap-2">
            {SUPPORTED_LANGUAGES.map((language) => {
              const selected = preferredLanguage === language;
              return (
                <label
                  key={language}
                  className={cn(
                    "flex h-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                    selected
                      ? "border-primary bg-secondary text-secondary-foreground"
                      : "border-input bg-card text-foreground hover:bg-muted",
                  )}
                >
                  <input
                    type="radio"
                    value={language}
                    className="sr-only"
                    {...form.register("preferredLanguage")}
                  />
                  {LANGUAGE_LABELS[language]}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone" className="flex items-center justify-between">
            <span>
              Emergency Contact Number <span className="text-muted-foreground font-normal">(Optional)</span>
            </span>
            <svg className="text-blue h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Label>
          <div className="relative flex items-center">
            <span className="absolute left-3 text-sm text-muted-foreground select-none">+91</span>
            <Input
              id="emergencyContactPhone"
              placeholder="Optional family member / caregiver phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              aria-invalid={form.formState.errors.emergencyContactPhone ? true : undefined}
              {...form.register("emergencyContactPhone")}
            />
          </div>
          {form.formState.errors.emergencyContactPhone ? (
            <p role="alert" className="text-sm text-destructive">
              {form.formState.errors.emergencyContactPhone.message}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground mt-1">
            Used only to reach a trusted contact in an emergency.
          </p>
        </div>

        {verifiedPhone ? (
          <div className="space-y-2">
            <Label htmlFor="verifiedPhone">Mobile number</Label>
            <Input id="verifiedPhone" value={verifiedPhone} readOnly aria-describedby="phone-note" />
            <p id="phone-note" className="text-xs text-muted-foreground">
              This is the number you just verified.
            </p>
          </div>
        ) : null}

        {saveError ? (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{saveError}</span>
          </div>
        ) : null}

        <div className="space-y-3 pt-1">
          <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
            {isSaving ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {isSaving ? "Saving…" : "Complete Registration &amp; Go to Dashboard"}
            {!isSaving ? (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            ) : null}
          </Button>
          <Button type="button" variant="ghost" className="w-full" disabled={isSaving} onClick={skipOptionalDetails}>
            Skip optional details
          </Button>
        </div>
      </form>

      <p className="mt-6 flex items-start gap-2 rounded-xl bg-secondary/60 p-3 text-xs leading-relaxed text-secondary-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        Your personal information is protected under <strong className="text-navy font-semibold">ABDM guidelines</strong> and used strictly to deliver healthcare services. No medical forms required at signup.
      </p>
    </div>
  );
}
