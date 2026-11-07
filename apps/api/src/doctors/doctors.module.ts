import { Module } from "@nestjs/common";
import { APP_ENV } from "../config/env";
import { APP_LOGGER } from "../common/logger";
import { createDoctorProvider, DOCTOR_PROVIDER } from "./providers/doctor-provider.factory";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [
    {
      provide: DOCTOR_PROVIDER,
      inject: [APP_ENV, APP_LOGGER],
      useFactory: createDoctorProvider,
    },
  ],
  exports: [DOCTOR_PROVIDER],
})
export class DoctorsModule {}
