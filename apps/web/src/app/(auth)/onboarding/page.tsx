"use client";

import { ArrowRight, CircleAlert, CircleCheck, Loader2, Phone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientProfilePutSchema } from "@medicare/validators";
import { SUPPORTED_LANGUAGES } from "@medicare/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { publicEnv } from "@/lib/env";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { AuthStepIndicator } from "@/features/auth/components/auth-step-indicator";

const LANGUAGE_LABELS: Record<(typeof SUPPORTED_LANGUAGES)[number], string> = {
  en: "English",
  hi: "हिन्दी",
  mr: "मराठी",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const form = useForm({
    resolver: zodResolver(patientProfilePutSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: null,
      gender: null,
      preferredLanguage: "en",
      accessibilityPreferences: [],
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setSaveError(null);
    setIsSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;

      const response = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}/v1/patients/me`, {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(values),
        cache: "no-store",
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        setSaveError(errorBody.error?.message || "Failed to save profile.");
        return;
      }

      router.push("/dashboard");
    } catch {
      setSaveError("We could not save your profile. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  });

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div>
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
              Let&apos;s set up your profile
            </h1>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
              Only the essential details needed to coordinate consultations, ambulance dispatches,
              and prescriptions.
            </p>
          </div>

          <AuthStepIndicator currentStep="profile" />

          <form onSubmit={submit} noValidate className="space-y-5">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm text-foreground" htmlFor="full-name">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  as per your government ID
                </span>
              </div>
              <div className="relative flex items-center">
                <Input
                  id="full-name"
                  placeholder="e.g. Rajesh Kumar Rao"
                  className="w-full h-[52px] px-4 pr-12 rounded-lg bg-card text-foreground text-base shadow-sm focus:outline-none focus:bg-card transition-all"
                  {...form.register("fullName")}
                />
                {form.formState.errors.fullName ? (
                  <CircleAlert aria-hidden="true" className="absolute right-4 h-5 w-5 text-destructive" />
                ) : (
                  <CircleCheck aria-hidden="true" className="absolute right-4 h-5 w-5 text-primary" />
                )}
              </div>
              {form.formState.errors.fullName ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.fullName.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-sm text-foreground" htmlFor="dob">
                  Date of Birth <span className="text-muted-foreground font-normal">(Optional)</span>
                </label>
                <span className="text-xs text-muted-foreground">
                  Helps dose calculations
                </span>
              </div>
              <div className="relative flex items-center">
                <Input
                  id="dob"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  className="w-full h-[52px] px-4 pr-12 rounded-lg bg-card text-foreground text-base shadow-sm focus:outline-none focus:bg-card transition-all"
                  {...form.register("dateOfBirth", {
                    setValueAs: (value) => (value === "" ? null : value),
                  })}
                />
              </div>
              {form.formState.errors.dateOfBirth ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.dateOfBirth.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-foreground">
                  Preferred Healthcare Language
                </legend>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1.5" id="lang-selector">
                  {SUPPORTED_LANGUAGES.map((language) => {
                    const selected = form.watch("preferredLanguage") === language;
                    return (
                      <label
                        key={language}
                        className={cn(
                          "h-11 rounded-lg text-sm flex items-center justify-center gap-1.5 transition-all border",
                          selected
                            ? "bg-secondary text-secondary-foreground font-bold shadow-sm border-transparent"
                            : "bg-muted text-foreground hover:bg-secondary/60 border-input",
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
            </div>

            <div className="space-y-1.5">
              <label className="text-sm text-foreground flex items-center justify-between" htmlFor="emergency-contact">
                <span className="">
                  Emergency Contact Number <span className="text-muted-foreground font-normal">(Optional)</span>
                </span>
                <Phone aria-hidden="true" className="h-4 w-4 text-primary" />
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-sm text-muted-foreground select-none">
                  +91
                </span>
                <Input
                  id="emergency-contact"
                  placeholder="Optional family member / caregiver phone"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  className="w-full h-[52px] pl-14 pr-4 rounded-lg bg-card text-foreground text-base shadow-sm focus:outline-none focus:bg-card transition-all"
                  {...form.register("emergencyContactPhone")}
                />
              </div>
              {form.formState.errors.emergencyContactPhone ? (
                <p role="alert" className="text-sm text-destructive">
                  {form.formState.errors.emergencyContactPhone.message}
                </p>
              ) : null}
            </div>

            <div className="pt-4 space-y-4">
              {saveError ? (
                <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  {saveError}
                </p>
              ) : null}
              <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : (
                  <>
                    Complete Registration &amp; Go to Dashboard
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </>
                )}
              </Button>
              <Button type="button" variant="ghost" className="w-full" disabled={isSaving} onClick={() => router.push("/dashboard")}>
                Skip optional details
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
