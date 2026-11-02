import { z } from "zod";

export const SUPPORTED_LANGUAGES = ["en", "hi"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const INDIAN_MOBILE = /^\+91[6-9]\d{9}$/;

/**
 * Accepts common Indian input formats (spaces, +91, 91, leading 0) and
 * normalizes to E.164 before validation.
 */
export function normalizeIndianPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  let national = digits;
  if (national.length === 12 && national.startsWith("91")) {
    national = national.slice(2);
  } else if (national.length === 11 && national.startsWith("0")) {
    national = national.slice(1);
  }
  return `+91${national}`;
}

export const indianPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform(normalizeIndianPhone)
  .refine((value) => INDIAN_MOBILE.test(value), {
    message: "Enter a valid 10-digit Indian mobile number",
  });

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Enter the 6-digit code sent to your phone");

export const loginSchema = z.object({ phone: indianPhoneSchema });
export const verifyOtpSchema = z.object({
  phone: indianPhoneSchema,
  token: otpCodeSchema,
});

export const icareQuestionSchema = z.object({
  question: z
    .string()
    .trim()
    .min(10, "Please add a little more detail (at least 10 characters)")
    .max(1000, "Keep the question under 1000 characters"),
  language: z.enum(SUPPORTED_LANGUAGES).default("en"),
});

export const emergencyRequestSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().trim().max(500).optional(),
});

export const ALLOWED_RECORD_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
] as const;

export const MAX_RECORD_BYTES = 20 * 1024 * 1024;

export const medicalRecordUploadSchema = z.object({
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .refine((name) => !name.includes("/") && !name.includes("\\"), {
      message: "File name must not contain path separators",
    }),
  mimeType: z.enum(ALLOWED_RECORD_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_RECORD_BYTES, "File must be 20 MB or smaller"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type IcareQuestionInput = z.infer<typeof icareQuestionSchema>;
export type EmergencyRequestInput = z.infer<typeof emergencyRequestSchema>;
export type MedicalRecordUploadInput = z.infer<typeof medicalRecordUploadSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

/** One-line, field-prefixed messages suitable for logs and API error payloads. */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".") || "value";
    return `${field}: ${issue.message}`;
  });
}
