import { Module } from "@nestjs/common";
import { APP_ENV } from "../config/env";
import { APP_LOGGER } from "../common/logger";
import { HospitalsController } from "./controllers/hospitals.controller";
import { HospitalAvailabilityController } from "./controllers/availability.controller";
import { createHospitalProvider, HOSPITAL_PROVIDER } from "./providers/hospital-provider.factory";
import { HospitalsService } from "./services/hospitals.service";
import { HospitalAvailabilityService } from "./services/hospital-availability.service";

@Module({
  controllers: [HospitalsController, HospitalAvailabilityController],
  providers: [
    HospitalsService,
    HospitalAvailabilityService,
    {
      provide: HOSPITAL_PROVIDER,
      inject: [APP_ENV, APP_LOGGER],
      useFactory: createHospitalProvider,
    },
  ],
  exports: [HospitalsService, HospitalAvailabilityService, HOSPITAL_PROVIDER],
})
export class HospitalsModule {}
