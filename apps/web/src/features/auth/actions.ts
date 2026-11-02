"use server";

import { loginSchema, verifyOtpSchema } from "@medicare/validators";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AUTH_NOT_CONFIGURED_MESSAGE } from "./messages";

export type SendOtpResult = { ok: true; phone: string } | { ok: false; message: string };
export type VerifyOtpResult = { ok: true } | { ok: false; message: string };

export async function sendOtpAction(input: unknown): Promise<SendOtpResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a valid phone number" };
  }

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
