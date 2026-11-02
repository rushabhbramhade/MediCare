import { z } from "zod";

const schema = z.object({
  API_BASE_URL: z.url().default("http://localhost:4000"),
  AUTH_RATE_LIMIT_LIMIT: z.coerce.number().int().min(1).max(1000).default(10),
});

const parsed = schema.safeParse({
  API_BASE_URL: process.env.API_BASE_URL,
  AUTH_RATE_LIMIT_LIMIT: process.env.AUTH_RATE_LIMIT_LIMIT,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join(".") || "value"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid server environment: ${details}`);
}

/** Server-only values. Never import this module from a Client Component. */
export const serverEnv = parsed.data;
