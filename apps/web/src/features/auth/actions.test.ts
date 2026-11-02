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
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      options: { shouldCreateUser: true },
    });
  });

  it("returns a safe error when the provider rejects the request", async () => {
    supabase.auth.signInWithOtp.mockResolvedValueOnce({
      error: { message: "rate limited upstream" },
    });

    await expect(sendOtpAction({ phone: "9876543210" })).resolves.toEqual({
      ok: false,
      message: "We could not send a code right now. Wait a moment and try again.",
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

  it("redirects to the dashboard after a verified OTP", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({ error: null });

    await verifyOtpAction({ phone: "9876543210", token: "123456" });

    expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
      phone: "+919876543210",
      token: "123456",
      type: "sms",
    });
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });

  it("does not redirect when the code is invalid or expired", async () => {
    supabase.auth.verifyOtp.mockResolvedValueOnce({
      error: { message: "Token has expired or is invalid" },
    });

    await expect(verifyOtpAction({ phone: "9876543210", token: "123456" })).resolves.toEqual({
      ok: false,
      message: "That code is invalid or has expired. Try again.",
    });
    expect(redirect).not.toHaveBeenCalled();
  });
});
