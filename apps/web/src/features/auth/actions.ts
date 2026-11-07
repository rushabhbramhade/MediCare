"use server";

import { API_ROUTES } from "@medicare/contracts";
import { loginSchema, verifyOtpSchema } from "@medicare/validators";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/server-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_NOT_CONFIGURED_MESSAGE } from "./messages";
import { checkRateLimit } from "./rate-limit";

export type SendOtpResult = { ok: true; phone: string } | { ok: false; message: string };
export type VerifyOtpResult = { ok: true; next: string } | { ok: false; message: string };
export type CheckAccountResult =
  | { exists: true }
  | { exists: false }
  | { ok: false; message: string };

function readIntent(input: unknown): "login" | "register" {
  if (typeof input === "object" && input !== null && "intent" in input) {
    return (input as { intent?: unknown }).intent === "register" ? "register" : "login";
  }
  return "login";
}

function sendErrorMessage(error: { code?: string; message: string }, intent: "login" | "register") {
  const code = error.code ?? "";
  if (code === "over_sms_send_rate_limit" || /rate limit/i.test(error.message)) {
    return "Too many codes requested. Wait a few minutes and try again.";
  }
  if (
    intent === "login" &&
    (code === "otp_disabled" || code === "signup_disabled" || /signups? not allowed/i.test(error.message))
  ) {
    return "No Medicare account found for this number. Create an account to get started.";
  }
  return "We could not send a code right now. Wait a moment and try again.";
}

/** Rate-limit keys come from the phone plus the caller IP; never from the body alone. */
async function rateLimitMessage(scope: "send" | "verify", phone: string): Promise<string | null> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || store.get("x-real-ip") || "unknown";

  for (const key of [`otp-${scope}:phone:${phone}`, `otp-${scope}:ip:${ip}`]) {
    const result = checkRateLimit(key, serverEnv.AUTH_RATE_LIMIT_LIMIT);
    if (!result.allowed) {
      return `Too many attempts. Try again in ${result.retryAfterSeconds} seconds.`;
    }
  }
  return null;
}

export async function sendOtpAction(input: unknown): Promise<SendOtpResult> {
  const intent = readIntent(input);
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid phone number" };
  }

  const limited = await rateLimitMessage("send", parsed.data.phone);
  if (limited) return { ok: false, message: limited };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: AUTH_NOT_CONFIGURED_MESSAGE };

  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
    // Sign-in must never create an account as a side effect.
    options: { shouldCreateUser: intent === "register" },
  });

  if (error) {
    console.error("send_otp_failed", error.code ?? error.message);
    return { ok: false, message: sendErrorMessage(error, intent) };
  }

  return { ok: true, phone: parsed.data.phone };
}

/**
 * Checks whether a mobile number is associated with an existing Supabase Auth
 * account. Reuses Supabase's own `shouldCreateUser: false` behaviour: if the
 * user exists, an OTP is sent and we return { exists: true }; if the user does
 * not exist, Supabase returns an error and we return { exists: false } without
 * revealing account details. Rate-limited like sendOtpAction to prevent
 * enumeration abuse.
 */
export async function checkAccountAction(
  input: unknown,
): Promise<CheckAccountResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid phone number" };
  }

  const limited = await rateLimitMessage("send", parsed.data.phone);
  if (limited) return { ok: false, message: limited };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: AUTH_NOT_CONFIGURED_MESSAGE };

  const { error } = await supabase.auth.signInWithOtp({
    phone: parsed.data.phone,
    options: { shouldCreateUser: false },
  });

  if (error) {
    const code = error.code ?? "";
    const message = error.message ?? "";
    if (
      code === "otp_disabled" ||
      code === "signup_disabled" ||
      /signups? not allowed|user not found|not found/i.test(message)
    ) {
      return { exists: false };
    }
    console.error("check_account_failed", code ?? message);
    return { ok: false, message: "We could not check your account. Try again." };
  }

  return { exists: true };
}

/**
 * Login continues to the dashboard only when a profile already exists. The API
 * is the source of truth; if it cannot answer, fall back to the dashboard.
 */
async function loginDestination(accessToken: string | undefined): Promise<string> {
  if (!accessToken) return "/dashboard";
  try {
    const response = await fetch(`${publicEnv.NEXT_PUBLIC_API_URL}${API_ROUTES.patientProfile}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (response.status === 404) return "/onboarding";
  } catch {
    // Profile check is best-effort; a network blip must not block sign-in.
  }
  return "/dashboard";
}

export async function verifyOtpAction(input: unknown): Promise<VerifyOtpResult> {
  const intent = readIntent(input);
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter the 6-digit code" };
  }

  const limited = await rateLimitMessage("verify", parsed.data.phone);
  if (limited) return { ok: false, message: limited };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: AUTH_NOT_CONFIGURED_MESSAGE };

  const { error, data } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: "sms",
  });

  if (error) {
    console.error("verify_otp_failed", error.code ?? error.message);
    if (error.code === "otp_expired") {
      return { ok: false, message: "Your verification code has expired. Request a new code." };
    }
    return { ok: false, message: "Incorrect verification code. Please try again." };
  }

  if (intent === "register") return { ok: true, next: "/onboarding" };
  return { ok: true, next: await loginDestination(data.session?.access_token) };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/login");
}
