import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "pino";
import { AuditService, sanitizeAuditMetadata } from "../audit.service";

function createLogger() {
  return { info: vi.fn(), error: vi.fn() } as unknown as Logger;
}

function createDatabase() {
  return { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 1 }) };
}

const event = {
  action: "patient_profile.updated",
  outcome: "success" as const,
  resourceType: "patient_profile",
  resourceId: "profile-1",
  requestId: "request-1",
  actorId: "00000000-0000-0000-0000-000000000001",
  actorRole: "patient" as const,
  statusCode: 200,
  durationMs: 5,
  metadata: { changedFields: ["fullName"] },
};

describe("sanitizeAuditMetadata", () => {
  it("drops sensitive keys at every level", () => {
    const result = sanitizeAuditMetadata({
      changedFields: ["fullName"],
      password: "secret",
      otp: "123456",
      accessToken: "jwt",
      apiKey: "key",
      nested: {
        authorization: "Bearer x",
        reportText: "clinical text",
        phone: "+919876543210",
        safe: "kept",
      },
    });

    expect(result).toEqual({
      changedFields: ["fullName"],
      nested: { safe: "kept" },
    });
    expect(JSON.stringify(result)).not.toContain("secret");
    expect(JSON.stringify(result)).not.toContain("123456");
  });

  it("caps strings and depth", () => {
    const result = sanitizeAuditMetadata({
      long: "x".repeat(1_000),
      deep: { a: { b: { c: "too deep" } } },
    });
    expect((result.long as string).length).toBe(256);
    expect(result.deep).toEqual({});
  });
});

describe("AuditService.record", () => {
  let logger: Logger;
  let database: ReturnType<typeof createDatabase>;
  let service: AuditService;

  beforeEach(() => {
    logger = createLogger();
    database = createDatabase();
    service = new AuditService(logger, database as never);
  });

  it("writes a persistent row with safe metadata", async () => {
    await service.record({ ...event, metadata: { ...event.metadata, phone: "+919876543210" } });

    expect(database.query).toHaveBeenCalledTimes(1);
    const [sql, values] = database.query.mock.calls[0] ?? [];
    expect(String(sql)).toContain("INSERT INTO app.audit_logs");
    expect(values).toEqual([
      event.actorId,
      "patient",
      "patient_profile.updated",
      "patient_profile",
      "profile-1",
      "request-1",
      "success",
      200,
      5,
      "api",
      JSON.stringify({ changedFields: ["fullName"] }),
    ]);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ audit: true, persisted: true }),
      "audit_event_persisted",
    );
  });

  it("is fail-open: a failed write logs and does not throw", async () => {
    database.query.mockRejectedValueOnce(new Error("database down"));
    await expect(service.record(event)).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ action: event.action }),
      "audit_persist_failed",
    );
  });
});

describe("AuditService.recordWithin", () => {
  it("is fail-closed: the caller sees the write failure", async () => {
    const database = createDatabase();
    database.query.mockRejectedValueOnce(new Error("database down"));
    const service = new AuditService(createLogger(), database as never);

    await expect(service.recordWithin(database as never, event)).rejects.toThrow("database down");
  });
});
