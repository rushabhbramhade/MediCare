import { Module } from "@nestjs/common";
import type { ApiEnv } from "../config/env";
import { APP_ENV } from "../config/env";
import { OsmController } from "./controllers/osm.controller";
import { OsmOverpassService } from "./services/osm-overpass.service";
import { RedisModule } from "../redis/redis.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [RedisModule, AuthModule],
  providers: [
    OsmOverpassService,
    {
      provide: "OSM_CONFIG",
      useFactory: (env: ApiEnv) => ({
        overpassApiUrl: env.OSM_OVERPASS_API_URL,
        timeoutSeconds: env.OSM_OVERPASS_TIMEOUT_SECONDS,
        cacheTtlSeconds: env.OSM_CACHE_TTL_SECONDS,
      }),
      inject: [APP_ENV],
    },
  ],
  controllers: [OsmController],
  exports: [OsmOverpassService],
})
export class OsmModule {}
