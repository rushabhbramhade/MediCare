import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_ENV, appEnvProvider } from "./env";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Root .env is the single source for API/workers; local file wins for overrides.
      envFilePath: ["../../.env", ".env"],
      ignoreEnvFile: process.env.NODE_ENV === "test",
    }),
  ],
  providers: [appEnvProvider],
  exports: [APP_ENV],
})
export class AppConfigModule {}
