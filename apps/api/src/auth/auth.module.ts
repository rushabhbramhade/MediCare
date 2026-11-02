import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { AuthRateLimitGuard } from "./guards/auth-rate-limit.guard";
import { AuthService } from "./services/auth.service";

@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthRateLimitGuard],
  exports: [AuthService],
})
export class AuthModule {}
