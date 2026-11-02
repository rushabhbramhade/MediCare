import type { ApiEnv } from "@medicare/config";
import type { Logger } from "pino";
import { DisabledHospitalProvider } from "./disabled-hospital-provider";
import { ManualHospitalProvider } from "./manual-hospital-provider";
import type { HospitalProvider } from "./hospital-provider";

export const HOSPITAL_PROVIDER = Symbol("MEDICARE_HOSPITAL_PROVIDER");

/**
 * Provider factory. `disabled` (the default) returns the disabled adapter.
 * `manual` returns the ManualHospitalProvider for development/sample records.
 * Any other value logs a warning and stays disabled, so a typo cannot fake a
 * feed. A real licensed adapter must be added here after a contract and
 * credentials exist.
 */
export function createHospitalProvider(env: ApiEnv, logger: Logger): HospitalProvider {
  const requested = env.HOSPITAL_PROVIDER;
  if (requested === "disabled") {
    return new DisabledHospitalProvider(requested, "no licensed hospital data contract");
  }

  if (requested === "manual") {
    return new ManualHospitalProvider();
  }

  logger.warn({ provider: requested }, "hospital_provider_not_implemented; staying disabled");
  return new DisabledHospitalProvider(requested, "the named adapter is not implemented");
}
