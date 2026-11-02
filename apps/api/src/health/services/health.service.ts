import type { HealthResponse, ReadinessResponse } from "@medicare/contracts";
import { Injectable } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class HealthService {
  constructor(
    private readonly database: DatabaseService,
    private readonly redis: RedisService,
  ) {}

  liveness(): HealthResponse {
    return {
      status: "ok",
      service: "medicare-api",
      version: process.env.npm_package_version ?? "0.1.0",
      timestamp: new Date().toISOString(),
    };
  }

  async readiness(): Promise<ReadinessResponse> {
    const [database, redis] = await Promise.allSettled([this.database.ping(), this.redis.ping()]);

    const checks = {
      database: database.status === "fulfilled" ? "up" : "down",
      redis: redis.status === "fulfilled" ? "up" : "down",
    } satisfies Record<string, "up" | "down">;

    return {
      status: checks.database === "up" && checks.redis === "up" ? "ok" : "degraded",
      checks,
    };
  }
}
