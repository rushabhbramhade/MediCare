import type { ApiEnv } from "@medicare/config";
import { Global, Module } from "@nestjs/common";
import { AppConfigModule } from "../config/config.module";
import { APP_ENV } from "../config/env";
import { APP_LOGGER, createLogger } from "./logger";

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [
    {
      provide: APP_LOGGER,
      useFactory: (env: ApiEnv) => createLogger(env),
      inject: [APP_ENV],
    },
  ],
  exports: [APP_LOGGER],
})
export class LoggerModule {}
