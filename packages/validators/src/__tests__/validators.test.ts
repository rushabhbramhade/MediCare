import { describe, expect, it } from "vitest";
import {
  emergencyRequestSchema,
  formatZodError,
  icareQuestionSchema,
  indianPhoneSchema,
  loginSchema,
  medicalRecordUploadSchema,
  normalizeIndianPhone,
  paginationSchema,
  verifyOtpSchema,
} from "../index";

describe("Indian phone normalization", () => {
  it.each([
    ["9876543210", "+919876543210"],
    ["+91 98765 43210", "+919876543210"],
    ["919876543210", "+919876543210"],
    ["09876543210", "+919876543210"],
    ["(98765) 43210", "+919876543210"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizeIndianPhone(input)).toBe(expected);
    expect(indianPhoneSchema.parse(input)).toBe(expected);
  });

  it.each(["12345", "+91987654321", "+911876543210", "abcdefghij", ""])("rejects %s", (input) => {
    expect(indianPhoneSchema.safeParse(input).success).toBe(false);
  });
});

describe("auth schemas", () => {
  it("accepts a valid login and OTP", () => {
    const login = loginSchema.parse({ phone: "9876543210" });
    expect(login.phone).toBe("+919876543210");
    expect(verifyOtpSchema.parse({ phone: "9876543210", token: "123456" }).token).toBe("123456");
  });

  it("rejects malformed OTPs", () => {
    const result = verifyOtpSchema.safeParse({ phone: "9876543210", token: "12ab56" });
    expect(result.success).toBe(false);
    if (!result.success) expect(formatZodError(result.error)[0]).toContain("token");
  });
});

describe("care and upload schemas", () => {
  it("requires a meaningful iCare question", () => {
    expect(icareQuestionSchema.safeParse({ question: "help" }).success).toBe(false);
    expect(
      icareQuestionSchema.parse({ question: "What does a high HbA1c result mean?" }).language,
    ).toBe("en");
  });

  it("validates emergency coordinates", () => {
    expect(emergencyRequestSchema.safeParse({ latitude: 19.076, longitude: 72.8777 }).success).toBe(
      true,
    );
    expect(emergencyRequestSchema.safeParse({ latitude: 120, longitude: 72.8777 }).success).toBe(
      false,
    );
  });

  it("enforces record type and size limits", () => {
    expect(
      medicalRecordUploadSchema.safeParse({
        fileName: "report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }).success,
    ).toBe(true);
    expect(
      medicalRecordUploadSchema.safeParse({
        fileName: "../report.exe",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      }).success,
    ).toBe(false);
    expect(
      medicalRecordUploadSchema.safeParse({
        fileName: "report.pdf",
        mimeType: "application/pdf",
        sizeBytes: 21 * 1024 * 1024,
      }).success,
    ).toBe(false);
  });

  it("applies pagination defaults and caps", () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, pageSize: 20 });
    expect(paginationSchema.safeParse({ pageSize: 500 }).success).toBe(false);
  });
});
