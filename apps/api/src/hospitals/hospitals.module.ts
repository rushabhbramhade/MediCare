import { Module } from "@nestjs/common";
import { APP_ENV } from "../config/env";
import { APP_LOGGER } from "../common/logger";
import { HospitalsController } from "./controllers/hospitals.controller";
import { createHospitalProvider, HOSPITAL_PROVIDER } from "./providers/hospital-provider.factory";
import { HospitalsService } from "./services/hospitals.service";

@Module({
  controllers: [HospitalsController],
  providers: [
    HospitalsService,
    {
      provide: HOSPITAL_PROVIDER,
      inject: [APP_ENV, APP_LOGGER],
      useFactory: createHospitalProvider,
    },
  ],
})
export class HospitalsModule {}
