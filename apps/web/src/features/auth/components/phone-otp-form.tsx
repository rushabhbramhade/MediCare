"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginSchema, otpCodeSchema } from "@medicare/validators";
import { StatusNote } from "@/components/shared/status-note";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isSupabaseConfigured } from "@/lib/env";
import { formatPhoneDisplay } from "@/lib/format";
import { sendOtpAction, verifyOtpAction } from "../actions";
import { AUTH_NOT_CONFIGURED_MESSAGE } from "../messages";

const tokenSchema = z.object({ token: otpCodeSchema });

type PhoneValues = z.infer<typeof loginSchema>;
type TokenValues = z.infer<typeof tokenSchema>;

export function PhoneOtpForm({ mode }: { mode: "login" | "register" }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const coolingDown = cooldownSeconds > 0;

  useEffect(() => {
    if (!coolingDown) return;
    const timer = setInterval(
      () => setCooldownSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [coolingDown]);

  const phoneForm = useForm<PhoneValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phone: "" },
  });
  const tokenForm = useForm<TokenValues>({
    resolver: zodResolver(tokenSchema),
    defaultValues: { token: "" },
  });

  if (!isSupabaseConfigured) {
    return (
      <StatusNote variant="warning" title="Phone sign-in is not configured">
        {AUTH_NOT_CONFIGURED_MESSAGE} The rest of the app runs, but patient areas stay locked until
        authentication is configured.
      </StatusNote>
    );
  }

  const submitPhone = phoneForm.handleSubmit(async (values) => {
    setFormError(null);
    const result = await sendOtpAction(values);
    if (!result.ok) {
      setFormError(result.message);
      return;
    }
    setPhone(result.phone);
    setCooldownSeconds(30);
    tokenForm.reset();
  });

  const submitToken = tokenForm.handleSubmit(async (values) => {
    if (!phone) return;
    setFormError(null);
    const result = await verifyOtpAction({ phone, token: values.token });
    if (!result.ok) setFormError(result.message);
  });

  if (phone) {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">We sent a 6-digit code to</p>
          <p className="font-medium">{formatPhoneDisplay(phone)}</p>
        </div>

        <form onSubmit={submitToken} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <Input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              placeholder="123456"
              aria-invalid={tokenForm.formState.errors.token ? true : undefined}
              aria-describedby={tokenForm.formState.errors.token ? "otp-error" : undefined}
              {...tokenForm.register("token")}
            />
            {tokenForm.formState.errors.token ? (
              <p id="otp-error" role="alert" className="text-sm text-destructive">
                {tokenForm.formState.errors.token.message}
              </p>
            ) : null}
          </div>

          {formError ? (
            <p role="alert" className="text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={tokenForm.formState.isSubmitting}>
            {tokenForm.formState.isSubmitting ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
            )}
            Verify and continue
          </Button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <button
            type="button"
            onClick={() => {
              setPhone(null);
              setFormError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded-md py-2 font-medium text-primary hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Use a different number
          </button>
          <button
            type="button"
            disabled={phoneForm.formState.isSubmitting || coolingDown}
            onClick={() => void submitPhone()}
            className="rounded-md py-2 font-medium text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            {coolingDown ? `Resend code in ${cooldownSeconds}s` : "Resend code"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Codes can take a minute to arrive. If one does not, wait before requesting another.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submitPhone} noValidate className="space-y-4">
      {mode === "register" ? (
        <p className="text-sm text-muted-foreground">
          Your account is created the first time you verify a mobile number. You can add profile
          details afterwards.
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="phone">Mobile number</Label>
        <Input
          id="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          autoFocus
          placeholder="98765 43210"
          aria-invalid={phoneForm.formState.errors.phone ? true : undefined}
          aria-describedby={phoneForm.formState.errors.phone ? "phone-error" : "phone-hint"}
          {...phoneForm.register("phone")}
        />
        <p id="phone-hint" className="text-xs text-muted-foreground">
          Indian mobile numbers only. We will text you a one-time code.
        </p>
        {phoneForm.formState.errors.phone ? (
          <p id="phone-error" role="alert" className="text-sm text-destructive">
            {phoneForm.formState.errors.phone.message}
          </p>
        ) : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={phoneForm.formState.isSubmitting}>
        {phoneForm.formState.isSubmitting ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : null}
        Send code
      </Button>
    </form>
  );
}
