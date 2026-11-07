import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "./rate-limit";

const supabase = vi.hoisted(() => ({
  auth: {
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signOut: vi.fn(),
  },
}));
const redirect = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => supabase),
}));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Map([["x-forwarded-for", "203.0.113.10"]])),
}));

import { sendOtpAction, verifyOtpAction } from "./actions";

describe("sendOtpAction", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.clearAllMocks();
  });

  it("rejects an invalid phone number before calling Supabase", async () => {
    await expect(sendOtpAction({ phone: "123" })).resolves.toEqual({
      ok: false,
      message: "Enter a valid 10-digit Indian mobile number",
    });
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("reports success only after Supabase accepts the OTP request", async () => {
    supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: null });

    await expect(sendOtpAction({ phone: "98765 43210" })).resolves.toEqual({
      ok: true,
      phone: "+919876543210",
    });
    // No intent passed defaults to login, which must NOT create an account.
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: false },
    });
  });

  it("returns a safe error when the provider rejects the request", async () => {
    supabase.auth.signInWithOtp.mockResolvedValueOnce({
      error: { message: "SMS provider unavailable" },
    });

    await expect(sendOtpAction({ phone: "9876543210" })).resolves.toEqual({
      ok: false,
      message: "We could not send a code right now. Wait a moment and try again.",
    });
  });

  it("does not create an account when signing in with register intent absent", async () => {
    supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: null });

    await sendOtpAction({ phone: "9876543210" });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: false },
    });
  });

  it("creates an account when registering with explicit register intent", async () => {
    supabase.auth.signInWithOtp.mockResolvedValueOnce({ error: null });

    await sendOtpAction({ phone: "9876543210", intent: "register" });
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: true },
    });
  });

  it("stops repeated OTP requests after the configured limit", async () => {
    supabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    for (let attempt = 0; attempt < 10; attempt += 1) {
      await expect(sendOtpAction({ phone: "9876543210" })).resolves.toMatchObject({ ok: true });
    }
    await expect(sendOtpAction({ phone: "9876543210" })).resolves.toMatchObject({
      ok: false,
      message: expect.stringContaining("Too many attempts"),
    });
  });
});

describe("verifyOtpAction", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.clearAllMocks();
  });

  it("rejects a malformed code before calling Supabase", async () => {
    await expect(verifyOtpAction({ phone: "9876543210", token: "12" })).resolves.toMatchObject({
      ok: false,
    });
    expect(supabase.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it("sends a signed-in user to the dashboard after a verified OTP", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({
      error: null,
      data: { session: { access_token: "fake-access-token" } },
    });

    await expect(verifyOtpAction({ phone: "9876543210", token: "123456" })).resolves.toEqual({
      ok: true,
      next: "/dashboard",
    });

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      token: "123456",
      type: "sms",
    });
  });

  it("falls back to dashboard when verified OTP returns no session", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({
      error: null,
      data: { session: null },
    });

    await expect(verifyOtpAction({ phone: "9876543210", token: "123456" })).resolves.toEqual({
      ok: true,
      next: "/dashboard",
    });
  });

  it("sends a new account to profile setup", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({ error: null });

    await expect(
      verifyOtpAction({ phone: "9876543210", token: "123456", intent: "register" }),
    ).resolves.toEqual({ ok: true, next: "/onboarding" });
  });

  it("explains when the code has expired", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({
      error: { code: "otp_expired", message: "Token has expired" },
    });

    await expect(verifyOtpAction({ phone: "9876543210", token: "123456" })).resolves.toEqual({
      ok: false,
      message: "Your verification code has expired. Request a new code.",
    });
  });

  it("does not continue when the code is incorrect", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({
      error: { message: "Invalid token" },
    });

    await expect(verifyOtpAction({ phone: "9876543210", token: "123456" })).resolves.toEqual({
      ok: false,
      message: "Incorrect verification code. Please try again.",
    });
  });
});
