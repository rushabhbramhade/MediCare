"use server";

import { loginSchema, verifyOtpSchema } from "@medicare/validators";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { serverEnv } from "@/lib/server-env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_NOT_CONFIGURED_MESSAGE } from "./messages";
import { checkRateLimit } from "./rate-limit";

export type SendOtpResult = { ok: true; phone: string } | { ok: false; message: string };
export type VerifyOtpResult = { ok: true } | { ok: false; message: string };

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
    options: { shouldCreateUser: true },
  });

  if (error) {
    console.error("send_otp_failed", error.message);
    return {
      ok: false,
      message: "We could not send a code right now. Wait a moment and try again.",
    };
  }

  return { ok: true, phone: parsed.data.phone };
}

export async function verifyOtpAction(input: unknown): Promise<VerifyOtpResult> {
  const parsed = verifyOtpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter the 6-digit code" };
  }

  const limited = await rateLimitMessage("verify", parsed.data.phone);
  if (limited) return { ok: false, message: limited };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: AUTH_NOT_CONFIGURED_MESSAGE };

  const { error } = await supabase.auth.verifyOtp({
    phone: parsed.data.phone,
    token: parsed.data.token,
    type: "sms",
  });

  if (error) {
    console.error("verify_otp_failed", error.message);
    return { ok: false, message: "That code is invalid or has expired. Try again." };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}
