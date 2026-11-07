import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import type { ApiEnv } from "@medicare/config";
import { AuditModule } from "./audit/audit.module";
import { AuthModule } from "./auth/auth.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { RolesGuard } from "./common/guards/roles.guard";
import { SupabaseAuthGuard } from "./common/guards/supabase-auth.guard";
import { AuditLogInterceptor } from "./common/interceptors/audit-log.interceptor";
import { LoggerModule } from "./common/logger.module";
import { AppConfigModule } from "./config/config.module";
import { APP_ENV } from "./config/env";
import { DatabaseModule } from "./database/database.module";
import { AmbulanceModule } from "./ambulance/ambulance.module";
import { DoctorsModule } from "./doctors/doctors.module";
import { HealthModule } from "./health/health.module";
import { HospitalsModule } from "./hospitals/hospitals.module";
import { MapModule } from "./map/map.module";
import { MedicalRecordsModule } from "./medical-records/medical-records.module";
import { OsmModule } from "./osm/osm.module";
import { PatientsModule } from "./patients/patients.module";
import { RedisModule } from "./redis/redis.module";

@Module({
  imports: [
    AppConfigModule,
    LoggerModule,
    ThrottlerModule.forRootAsync({
      inject: [APP_ENV],
      useFactory: (env: ApiEnv) => ({
        throttlers: [
          {
            name: "default",
            ttl: env.RATE_LIMIT_TTL_MS,
            limit: env.RATE_LIMIT_LIMIT,
          },
        ],
      }),
    }),
    DatabaseModule,
    RedisModule,
    AuditModule,
    AuthModule,
    HealthModule,
    PatientsModule,
    HospitalsModule,
    MapModule,
    DashboardModule,
    MedicalRecordsModule,
    OsmModule,
    AmbulanceModule,
    DoctorsModule,
  ],
  providers: [
    // Order matters: throttle -> authenticate -> authorize.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
  ],
})
export class AppModule {}
