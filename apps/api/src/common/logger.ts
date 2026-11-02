import type { ApiEnv } from "@medicare/config";
import pino, { type Logger } from "pino";

export const APP_LOGGER = Symbol("MEDICARE_LOGGER");

/**
 * Structured logs only. Known sensitive keys are redacted as a second line of
 * defence; request bodies are never logged by the API.
 */
export function createLogger(env: Pick<ApiEnv, "LOG_LEVEL">): Logger {
  return pino({
    level: env.LOG_LEVEL,
    base: { service: "medicare-api" },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: [
        "req.headers.authorization",
        "req.headers.cookie",
        "password",
        "token",
        "otp",
        "apiKey",
        "*.password",
        "*.token",
        "*.otp",
      ],
      censor: "[redacted]",
    },
  });
}
