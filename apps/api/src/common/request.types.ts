import type { AuthUser } from "@medicare/types";
import type { Request } from "express";

/**
 * pino-http sets `id` to a string at runtime; the Express augmentation types it
 * more broadly, so override it here rather than widening every consumer.
 */
export type AuthenticatedRequest = Omit<Request, "id"> & {
  user?: AuthUser;
  id?: string;
  /** Set by AuditLogInterceptor so the exception filter does not double-record. */
  auditIntercepted?: boolean;
};
