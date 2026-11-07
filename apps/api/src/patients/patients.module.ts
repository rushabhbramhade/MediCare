import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PatientsController } from "./controllers/patients.controller";
import { PatientsService } from "./services/patients.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuditModule, AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
