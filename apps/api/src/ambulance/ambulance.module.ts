import { Module } from "@nestjs/common";
import { AmbulanceController } from "./ambulance.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [AmbulanceController],
})
export class AmbulanceModule {}
