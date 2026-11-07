"use client";

import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { sendOtpAction, verifyOtpAction } from "@/features/auth/actions";
import { emptyOtp, OTP_LENGTH } from "@/features/auth/otp";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPhoneDisplay } from "@/lib/format";
import { OtpInput } from "@/features/auth/components/otp-input";

const RESEND_SECONDS = 30;

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent") === "register" ? "register" : "login";
  const phone = searchParams.get("phone") ?? "";

  const [otp, setOtp] = useState<string[]>(emptyOtp);
  const [formError, setFormError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(RESEND_SECONDS);
  const [isSending, setIsSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleResend() {
    if (cooldownSeconds > 0 || isSending) return;
    setFormError(null);
    setNotice(null);
    setIsSending(true);
    try {
      const result = await sendOtpAction({ phone, intent });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      setOtp(emptyOtp());
      setOtpInvalid(false);
      setCooldownSeconds(RESEND_SECONDS);
      setNotice("A new verification code is on its way.");
    } catch {
      setFormError("Unable to resend the code. Please try again later.");
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => setCooldownSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  async function handleVerify() {
    if (isVerifying) return;
    const token = otp.join("");
    if (token.length !== OTP_LENGTH) {
      setOtpInvalid(true);
      setFormError("Enter the six-digit verification code.");
      return;
    }

    setFormError(null);
    setOtpInvalid(false);
    setIsVerifying(true);
    try {
      const result = await verifyOtpAction({ phone, token, intent });
      if (!result.ok) {
        setFormError(result.message);
        setOtp(emptyOtp());
        setOtpInvalid(true);
        return;
      }
      router.replace(intent === "register" ? "/onboarding" : result.next);
    } catch {
      setFormError("We could not verify the code. Check your connection and try again.");
    } finally {
      setIsVerifying(false);
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
      <button
        type="button"
        onClick={() => router.push(intent === "register" ? "/register" : "/login")}
        className="mb-6 inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
        Change mobile number
      </button>

      <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Verify your mobile number
      </h1>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">
        Enter the six-digit verification code sent to{" "}
        <span className="font-medium text-navy">{formatPhoneDisplay(phone)}</span>.
      </p>

      {formError ? (
        <div role="alert" className="mt-5 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      {notice ? (
        <p role="status" className="mt-3 text-sm font-medium text-primary">
          {notice}
        </p>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void handleVerify();
        }}
        noValidate
        className="mt-6 space-y-5"
      >
        <OtpInput
          value={otp}
          onChange={setOtp}
          disabled={isVerifying}
          invalid={otpInvalid}
          autoFocus
        />

        <button
          type="submit"
          disabled={isVerifying}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
        >
          {isVerifying ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
          {isVerifying ? "Verifying…" : "Verify & Continue"}
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={cooldownSeconds > 0 || isSending}
          className="rounded-md font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` : "Resend code"}
        </button>
      </div>

      <p className="mt-auto flex items-start gap-2 pt-8 text-xs leading-relaxed text-muted-foreground">
        <ShieldCheck aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Codes can take a minute to arrive. Never share this code with anyone.
      </p>
    </>
  );
}

export default function OtpPage() {
  return (
    <Suspense fallback={null}>
      <OtpContent />
    </Suspense>
  );
}
