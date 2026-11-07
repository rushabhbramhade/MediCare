"use client";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@medicare/validators";
import {
  checkAccountAction,
  sendOtpAction,
  verifyOtpAction,
} from "@/features/auth/actions";
import { emptyOtp, OTP_LENGTH } from "@/features/auth/otp";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPhoneDisplay } from "@/lib/format";
import { AuthPhoneInput } from "@/features/auth/components/auth-phone-input";
import { OtpInput } from "@/features/auth/components/otp-input";

type Step = "phone" | "otp" | "success";

const RESEND_SECONDS = 30;

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState<string[]>(emptyOtp());
  const [otpInvalid, setOtpInvalid] = useState(false);
  const [accountIntent, setAccountIntent] = useState<"login" | "register">("login");
  const successTarget = useRef("/dashboard");
  const coolingDown = cooldownSeconds > 0;

  const phoneForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "" },
  });

  useEffect(() => {
    if (!coolingDown) return;
    const timer = setInterval(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [coolingDown]);

  useEffect(() => {
    if (step !== "success") return;
    const timer = setTimeout(() => router.replace(successTarget.current), 1200);
    return () => clearInterval(timer);
  }, [step, router]);

  if (!isSupabaseConfigured) {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-base text-muted-foreground">
              Phone sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY to apps/web/.env.local.
            </p>
          </div>
        </div>
      </>
    );
  }

  function resetOtp() {
    setOtp(emptyOtp());
    setOtpInvalid(false);
  }

  const submitPhone = async (values: { phone: string }) => {
    if (isSending) return;
    setFormError(null);
    setNotice(null);
    setIsSending(true);
    try {
      const checkResult = await checkAccountAction(values);

      if ("exists" in checkResult) {
        if (checkResult.exists) {
          setPhone(values.phone);
          setAccountIntent("login");
          setStep("otp");
          setCooldownSeconds(RESEND_SECONDS);
          setNotice("Verification code sent.");
          return;
        }

        const sendResult = await sendOtpAction({
          phone: values.phone,
          intent: "register",
        });
        if (!sendResult.ok) {
          setFormError(sendResult.message);
          return;
        }
        setPhone(values.phone);
        setAccountIntent("register");
        setStep("otp");
        setCooldownSeconds(RESEND_SECONDS);
        setNotice("Verification code sent.");
        return;
      }

      setFormError(checkResult.message);
    } catch {
      setFormError("We could not reach Medicare. Check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  };

  async function resendCode() {
    if (!phone || coolingDown || isSending) return;
    setFormError(null);
    setNotice(null);
    setIsSending(true);
    try {
      const result = await sendOtpAction({ phone, intent: accountIntent });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      resetOtp();
      setCooldownSeconds(RESEND_SECONDS);
      setNotice("A new verification code is on its way.");
    } catch {
      setFormError("Unable to send OTP. Please try again later.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleVerify(token: string) {
    if (!phone || isVerifying) return;

    if (token.length !== OTP_LENGTH) {
      setOtpInvalid(true);
      setFormError("Enter the six-digit verification code.");
      return;
    }

    setFormError(null);
    setNotice(null);
    setOtpInvalid(false);
    setIsVerifying(true);
    try {
      const result = await verifyOtpAction({ phone, token, intent: accountIntent });
      if (!result.ok) {
        setFormError(result.message);
        resetOtp();
        return;
      }
      successTarget.current = result.next;
      setStep("success");
    } catch {
      setFormError("We could not verify the code. Check your connection and try again.");
    } finally {
      setIsVerifying(false);
    }
  }

  function changeNumber() {
    setStep("phone");
    setPhone(null);
    setFormError(null);
    setNotice(null);
    setCooldownSeconds(0);
    resetOtp();
    phoneForm.reset({ phone: "" });
  }

  if (step === "success") {
    return (
      <>
        <div className="flex flex-1 flex-col items-center justify-center py-10" role="status" aria-live="polite">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-primary">
            <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            {accountIntent === "register" ? "Account created" : "Signed in"}
          </h1>
          <p className="mt-2 max-w-md text-base leading-relaxed text-muted-foreground">
            {accountIntent === "register"
              ? "Your mobile number is verified. Let's set up your profile."
              : "Welcome back. Taking you to your dashboard."}
          </p>
          <p className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            Redirecting…
          </p>
        </div>
      </>
    );
  }

  if (step === "otp") {
    return (
      <>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={changeNumber}
              className="inline-flex w-fit items-center gap-1.5 rounded-md text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
              Change mobile number
            </button>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Verify your mobile number
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Enter the six-digit verification code sent to{" "}
            <span className="font-medium text-navy">{formatPhoneDisplay(phone ?? undefined)}</span>.
          </p>

          {formError ? (
            <div role="alert" className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <span className="mt-0.5 h-4 w-4 shrink-0">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <span>{formError}</span>
            </div>
          ) : null}

          {notice ? (
            <p role="status" className="mt-5 text-sm font-medium text-primary">{notice}</p>
          ) : null}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify(otp.join(""));
            }}
            noValidate
            className="mt-6 space-y-5"
          >
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                One-time security code
              </label>
              <OtpInput
                value={otp}
                onChange={setOtp}
                disabled={isVerifying}
                invalid={otpInvalid}
                autoFocus
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                Paste the code or type it digit by digit.
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground text-base rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
              disabled={isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </form>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">Didn&apos;t receive the code?</span>
            <button
              type="button"
              onClick={() => void resendCode()}
              disabled={coolingDown}
              className="rounded-md font-medium text-primary underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {coolingDown ? `Resend in ${cooldownSeconds}s` : "Resend OTP"}
            </button>
          </div>

          <p className="mt-auto flex items-start gap-2 pt-8 text-xs leading-relaxed text-muted-foreground">
            <span className="mt-0.5 h-3.5 w-3.5 shrink-0">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </span>
            Codes can take a minute to arrive. Never share this code with anyone.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-1 flex-col">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1  text-xs font-semibold text-secondary-foreground">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary" />
            Medicare Platform
          </span>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
            Welcome to Medicare
          </h1>
          <p className="mt-2 text-base leading-relaxed text-muted-foreground">
            Your healthcare, connected in one place.
          </p>
        </div>

        <form
          onSubmit={phoneForm.handleSubmit(submitPhone)}
          noValidate
          className="space-y-4"
          id="otp-auth-form"
        >
          <AuthPhoneInput formError={formError} form={phoneForm} />

          <button
            type="submit"
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-base flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.99] cursor-pointer"
            id="auth-submit-btn"
            disabled={isSending}
          >
            <span id="submit-text">
              {isSending ? "Sending code…" : "Continue with Mobile Number"}
            </span>
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-sm text-muted-foreground">
            New to Medicare?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </div>

        <div className="mt-auto flex items-start gap-2 rounded-xl bg-muted p-3 pt-3">
          <Lock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span className="text-xs leading-relaxed text-muted-foreground">
            Secure, passwordless phone verification. No password required.
          </span>
        </div>
      </div>
    </>
  );
}
