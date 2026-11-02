import type { ApiEnv } from "@medicare/config";
import type { Logger } from "pino";
import { DisabledHospitalProvider } from "./disabled-hospital-provider";
import type { HospitalProvider } from "./hospital-provider";

export const HOSPITAL_PROVIDER = Symbol("MEDICARE_HOSPITAL_PROVIDER");

/**
 * Only `disabled` is implemented. Setting any other value does not enable a
 * vendor: it logs a warning and stays disabled, so a typo cannot fake a feed.
 * A real adapter must be added here after a contract and credentials exist.
 */
export function createHospitalProvider(env: ApiEnv, logger: Logger): HospitalProvider {
  const requested = env.HOSPITAL_PROVIDER;
  if (requested === "disabled") {
    return new DisabledHospitalProvider(requested, "no licensed hospital data contract");
  }

  logger.warn({ provider: requested }, "hospital_provider_not_implemented; staying disabled");
  return new DisabledHospitalProvider(requested, "the named adapter is not implemented");
}
