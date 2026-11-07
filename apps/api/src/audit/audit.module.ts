import { Module } from "@nestjs/common";
import { AuditService } from "./audit.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
