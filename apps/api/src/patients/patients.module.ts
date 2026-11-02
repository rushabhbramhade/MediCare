import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PatientsController } from "./controllers/patients.controller";
import { PatientsService } from "./services/patients.service";

@Module({
  imports: [AuditModule],
  controllers: [PatientsController],
  providers: [PatientsService],
})
export class PatientsModule {}
