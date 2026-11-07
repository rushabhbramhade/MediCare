import { Module } from "@nestjs/common";
import type { ApiEnv } from "@medicare/config";
import { APP_ENV } from "../config/env";
import { AuthModule } from "../auth/auth.module";
import { OCRController } from "./controllers/ocr.controller";
import { OCRService } from "./services/ocr.service";

@Module({
  imports: [AuthModule],
  controllers: [OCRController],
  providers: [
    OCRService,
    {
      provide: "OCR_CONFIG",
      useFactory: (env: ApiEnv) => ({
        provider: env.OCR_PROVIDER,
        aiServiceUrl: env.AI_SERVICE_URL,
        internalServiceToken: env.INTERNAL_SERVICE_TOKEN,
        maxFileSizeMB: env.OCR_MAX_FILE_SIZE_MB,
        maxPages: env.OCR_MAX_PAGES,
        timeoutSeconds: env.OCR_TIMEOUT_SECONDS,
      }),
      inject: [APP_ENV],
    },
  ],
})
export class MedicalRecordsModule {}
