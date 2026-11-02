import type { Role } from "@medicare/types";
import { Inject, Injectable } from "@nestjs/common";
import type { Logger } from "pino";
import { APP_LOGGER } from "../common/logger";

export interface AuditEvent {
  action: string;
  outcome: "success" | "failure";
  statusCode: number;
  durationMs: number;
  requestId?: string;
  userId?: string;
  role?: Role;
}

/**
 * Foundation only: writes structured audit events to the log stream.
 * Persistent, append-only audit storage is a documented next milestone; do not
 * treat logs as a compliance-grade audit trail yet.
 */
@Injectable()
export class AuditService {
  constructor(@Inject(APP_LOGGER) private readonly logger: Logger) {}

  record(event: AuditEvent): void {
    this.logger.info({ audit: true, ...event }, "audit_event");
  }
}
