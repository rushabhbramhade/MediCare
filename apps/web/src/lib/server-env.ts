import { z } from "zod";

const schema = z.object({
  API_BASE_URL: z.url().default("http://localhost:4000"),
});

const parsed = schema.safeParse({
  API_BASE_URL: process.env.API_BASE_URL,
});

if (!parsed.success) {
  throw new Error("Invalid server environment: API_BASE_URL must be a valid URL");
}

/** Server-only values. Never import this module from a Client Component. */
export const serverEnv = parsed.data;
