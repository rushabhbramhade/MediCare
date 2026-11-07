import type { ApiEnv } from "@medicare/config";
import type { Logger } from "pino";
import { DisabledDoctorProvider } from "./disabled-doctor-provider";
import type { DoctorProvider } from "./doctor-provider";

export const DOCTOR_PROVIDER = Symbol("MEDICARE_DOCTOR_PROVIDER");

/**
 * Provider factory. `disabled` (the default) returns the disabled adapter.
 * Any other value logs a warning and stays disabled, so a typo cannot fake a
 * feed. A real licensed adapter must be added here after a contract and
 * credentials exist.
 */
export function createDoctorProvider(env: ApiEnv, logger: Logger): DoctorProvider {
  const requested = env.DOCTOR_PROVIDER;
  if (requested === "disabled") {
    return new DisabledDoctorProvider(requested, "no licensed doctor data contract");
  }

  logger.warn({ provider: requested }, "doctor_provider_not_implemented; staying disabled");
  return new DisabledDoctorProvider(requested, "the named adapter is not implemented");
}
