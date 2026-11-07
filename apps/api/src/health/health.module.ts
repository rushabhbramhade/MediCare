import { Module } from "@nestjs/common";
import { HealthController } from "./controllers/health.controller";
import { HealthService } from "./services/health.service";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
