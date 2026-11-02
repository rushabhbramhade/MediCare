import { loadApiEnv, type ApiEnv } from "@medicare/config";
import type { Provider } from "@nestjs/common";

export const APP_ENV = Symbol("MEDICARE_API_ENV");
export type { ApiEnv };

/** Validated once at startup; a bad environment fails fast with field details. */
export const appEnvProvider: Provider = {
  provide: APP_ENV,
  useFactory: () => loadApiEnv(process.env),
};
