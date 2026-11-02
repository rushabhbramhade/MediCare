import {
  ACCESSIBILITY_PREFERENCES,
  GENDERS,
  HOSPITAL_TYPES,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@medicare/types";
import { z } from "zod";

export { SUPPORTED_LANGUAGES, type SupportedLanguage };

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

const dateOnlySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a real calendar date")
  .refine(
    (value) => value <= new Date().toISOString().slice(0, 10),
    "Date of birth cannot be in the future",
  );

const accessibilityPreferencesSchema = z
  .array(z.enum(ACCESSIBILITY_PREFERENCES))
  .max(ACCESSIBILITY_PREFERENCES.length)
  .refine((items) => new Set(items).size === items.length, "Choose each preference once");

const patientProfileFields = {
  fullName: z
    .string()
    .trim()
    .min(1, "Enter your full name")
    .max(120, "Keep your full name under 120 characters"),
  dateOfBirth: dateOnlySchema.nullish(),
  gender: z.enum(GENDERS).nullish(),
  preferredLanguage: z.enum(SUPPORTED_LANGUAGES),
  accessibilityPreferences: accessibilityPreferencesSchema,
} as const;

/**
 * PUT replaces the whole profile. Phone is intentionally absent: it is taken
 * only from the verified identity token, never from the request body.
 */
export const patientProfilePutSchema = z
  .object({
    ...patientProfileFields,
    preferredLanguage: patientProfileFields.preferredLanguage.default("en"),
    accessibilityPreferences: patientProfileFields.accessibilityPreferences.default([]),
  })
  .strict();

export const patientProfilePatchSchema = z
  .object(patientProfileFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");

const requiredCoordinate = (min: number, max: number, label: string) =>
  z.preprocess(
    (value) => (value === "" || value === undefined || value === null ? undefined : value),
    z.coerce
      .number()
      .min(min, `${label} must be at least ${min}`)
      .max(max, `${label} must be at most ${max}`),
  );

const booleanQueryParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return value;
}, z.boolean().default(false));

export const hospitalSearchSchema = z
  .object({
    latitude: requiredCoordinate(-90, 90, "latitude"),
    longitude: requiredCoordinate(-180, 180, "longitude"),
    radiusKm: z.coerce
      .number()
      .min(0.5, "Radius must be at least 0.5 km")
      .max(15, "Radius must be at most 15 km")
      .default(5),
    specialty: z.string().trim().min(1).max(80).optional(),
    emergencyOnly: booleanQueryParam,
    hospitalType: z.enum(HOSPITAL_TYPES).optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(20),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type IcareQuestionInput = z.infer<typeof icareQuestionSchema>;
export type EmergencyRequestInput = z.infer<typeof emergencyRequestSchema>;
export type MedicalRecordUploadInput = z.infer<typeof medicalRecordUploadSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type PatientProfilePutInput = z.infer<typeof patientProfilePutSchema>;
export type PatientProfilePutFormInput = z.input<typeof patientProfilePutSchema>;
export type PatientProfilePatchInput = z.infer<typeof patientProfilePatchSchema>;
export type HospitalSearchInput = z.infer<typeof hospitalSearchSchema>;

/** One-line, field-prefixed messages suitable for logs and API error payloads. */
export function formatZodError(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const field = issue.path.join(".") || "value";
    return `${field}: ${issue.message}`;
  });
}
