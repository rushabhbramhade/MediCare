"use client";

import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@medicare/validators";
import { sendOtpAction } from "@/features/auth/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { AuthPhoneInput } from "@/features/auth/components/auth-phone-input";
import { AuthStepIndicator } from "@/features/auth/components/auth-step-indicator";

export default function RegisterPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [consent, setConsent] = useState(false);

  const phoneForm = useForm<{ phone: string }>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "" },
  });

  async function submitPhone(values: { phone: string }) {
    if (isSending) return;
    setFormError(null);
    setIsSending(true);
    try {
      const result = await sendOtpAction({ phone: values.phone, intent: "register" });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      router.push(`/otp?intent=register&phone=${encodeURIComponent(values.phone)}`);
    } catch {
      setFormError("We could not reach Medicare. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <>
        <p className="rounded-xl border border-border bg-card p-6 text-base text-muted-foreground">
          Phone sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY to apps/web/.env.local.
        </p>
      </>
    );
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
          Create your Medicare account
        </h1>
        <p className="mt-2 max-w-lg text-base leading-relaxed text-muted-foreground">
          Manage your healthcare services, connect with verified doctors, and keep your reports in
          one place.
        </p>
      </div>

      <AuthStepIndicator currentStep="phone" />

      <form
        onSubmit={phoneForm.handleSubmit(submitPhone)}
        noValidate
        className="space-y-5"
      >
        <AuthPhoneInput
          formError={formError}
          form={phoneForm}
        />

        <div className="flex items-start gap-2.5">
          <input
            id="consent"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-input accent-primary"
          />
          <label htmlFor="consent" className="text-sm leading-snug text-muted-foreground">
            I agree to the{" "}
            <Link href="/terms" className="font-medium text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="font-medium text-primary hover:underline">
              Privacy Policy
            </Link>
            , and consent to receiving service-related OTPs and alerts.
          </label>
        </div>

        <button
          type="submit"
          disabled={isSending || !consent}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {isSending ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Sending Verification Code
            </>
          ) : (
            <>
              Send Verification Code
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have a Medicare account?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </p>

      <div className="mt-auto flex items-start gap-3 rounded-xl bg-muted p-4 pt-4">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="block font-semibold text-foreground">Confidential authentication</span>
          Your phone number is used for authentication and care coordination. We do not share your
          data without explicit consent.
        </p>
      </div>
    </>
  );
}
