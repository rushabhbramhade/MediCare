import type { Role } from "@medicare/types";
import { Inject, Injectable } from "@nestjs/common";
import type { Logger } from "pino";
import { DatabaseService } from "../database/database.service";
import { APP_LOGGER } from "../common/logger";

export interface AuditQueryExecutor {
  query(text: string, values?: readonly unknown[]): Promise<unknown>;
}

export interface AuditEvent {
  action: string;
  outcome: "success" | "failure";
  resourceType: string;
  resourceId?: string;
  requestId?: string;
  actorId?: string;
  actorRole?: Role;
  statusCode?: number;
  durationMs?: number;
  source?: string;
  metadata?: Record<string, unknown>;
}

const SENSITIVE_KEY =
  /pass(word)?|otp|token|secret|api[_-]?key|authorization|cookie|report|document|content|phone|email|address/i;
const MAX_STRING_LENGTH = 256;
const MAX_KEYS = 20;
const MAX_DEPTH = 2;

function scrubValue(value: unknown, depth: number): unknown {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.slice(0, MAX_STRING_LENGTH);
  if (depth >= MAX_DEPTH) return undefined;
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_KEYS)
      .map((item) => scrubValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }
  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS)) {
      if (SENSITIVE_KEY.test(key)) continue;
      const scrubbed = scrubValue(item, depth + 1);
      if (scrubbed !== undefined) result[key] = scrubbed;
    }
    return result;
  }
  return undefined;
}

/** Keep only safe, small metadata. Sensitive keys are dropped, not masked. */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const scrubbed = scrubValue(metadata ?? {}, 0);
  return typeof scrubbed === "object" && scrubbed !== null && !Array.isArray(scrubbed)
    ? (scrubbed as Record<string, unknown>)
    : {};
}

const INSERT_SQL = `
  INSERT INTO app.audit_logs (
    actor_id, actor_role, action, resource_type, resource_id, request_id,
    outcome, status_code, duration_ms, source, metadata
  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
`;

/**
 * Persistent audit trail.
 *
 * Failure policy:
 * - `record()` is fail-open. Used for reads and generic request events: a failed
 *   write is logged and the request continues.
 * - `recordWithin()` is fail-closed. Used by patient-profile writes inside the
 *   same transaction, so a failed audit write rolls the data change back.
 */
@Injectable()
export class AuditService {
  constructor(
    @Inject(APP_LOGGER) private readonly logger: Logger,
    private readonly database: DatabaseService,
  ) {}

  async record(event: AuditEvent): Promise<void> {
    const safe = this.normalise(event);
    this.logger.info({ audit: true, persisted: false, ...safe }, "audit_event_observed");
    try {
      await this.persist(this.database, safe);
      this.logger.info(
        { audit: true, persisted: true, action: safe.action, requestId: safe.requestId },
        "audit_event_persisted",
      );
    } catch (error) {
      this.logger.error(
        { err: error, action: safe.action, requestId: safe.requestId },
        "audit_persist_failed",
      );
    }
  }

  /** Throws if the insert fails. The caller's transaction must roll back. */
  async recordWithin(client: AuditQueryExecutor, event: AuditEvent): Promise<void> {
    const safe = this.normalise(event);
    await this.persist(client, safe);
    this.logger.info(
      { audit: true, persisted: true, action: safe.action, requestId: safe.requestId },
      "audit_event_persisted",
    );
  }

  private normalise(event: AuditEvent) {
    return {
      action: event.action.slice(0, 200),
      outcome: event.outcome,
      resourceType: event.resourceType.slice(0, 100),
      resourceId: event.resourceId?.slice(0, 200),
      requestId: event.requestId?.slice(0, 128),
      actorId: event.actorId,
      actorRole: event.actorRole,
      statusCode: event.statusCode,
      durationMs: event.durationMs,
      source: (event.source ?? "api").slice(0, 64),
      metadata: sanitizeAuditMetadata(event.metadata),
    };
  }

  private async persist(
    executor: AuditQueryExecutor,
    event: ReturnType<AuditService["normalise"]>,
  ): Promise<void> {
    await executor.query(INSERT_SQL, [
      event.actorId ?? null,
      event.actorRole ?? null,
      event.action,
      event.resourceType,
      event.resourceId ?? null,
      event.requestId ?? null,
      event.outcome,
      event.statusCode ?? null,
      event.durationMs ?? null,
      event.source,
      JSON.stringify(event.metadata),
    ]);
  }
}
