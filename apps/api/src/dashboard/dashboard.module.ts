import { Module } from "@nestjs/common";
import { APP_LOGGER } from "../common/logger";
import { LoggerModule } from "../common/logger.module";
import { DashboardController } from "./dashboard.controller";
import { DashboardService } from "./dashboard.service";
import { HospitalsModule } from "../hospitals/hospitals.module";
import { PatientsModule } from "../patients/patients.module";
import { MapModule } from "../map/map.module";

@Module({
  imports: [LoggerModule, HospitalsModule, PatientsModule, MapModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
