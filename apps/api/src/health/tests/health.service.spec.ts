import { describe, expect, it, vi, type Mock } from "vitest";
import { HealthService } from "../services/health.service";
import type { DatabaseService } from "../../database/database.service";
import type { RedisService } from "../../redis/redis.service";

function service(databasePing: Mock, redisPing: Mock): HealthService {
  return new HealthService(
    { ping: databasePing } as unknown as DatabaseService,
    { ping: redisPing } as unknown as RedisService,
  );
}

describe("HealthService", () => {
  it("reports ok when every dependency answers", async () => {
    const result = await service(vi.fn().mockResolvedValue(undefined), vi.fn()).readiness();
    expect(result).toEqual({ status: "ok", checks: { database: "up", redis: "up" } });
  });

  it("reports degraded when a dependency fails", async () => {
    const result = await service(
      vi.fn().mockRejectedValue(new Error("db down")),
      vi.fn().mockResolvedValue("PONG"),
    ).readiness();
    expect(result).toEqual({ status: "degraded", checks: { database: "down", redis: "up" } });
  });

  it("returns a liveness payload without touching dependencies", () => {
    const database = vi.fn();
    const redis = vi.fn();
    const result = service(database, redis).liveness();
    expect(result.status).toBe("ok");
    expect(result.service).toBe("medicare-api");
    expect(database).not.toHaveBeenCalled();
    expect(redis).not.toHaveBeenCalled();
  });
});
