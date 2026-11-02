import { APP_LOGGER } from "../logger";
import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  type ExceptionFilter,
} from "@nestjs/common";
import type { ApiErrorBody } from "@medicare/types";
import type { Logger } from "pino";
import type { Response } from "express";
import { AuditService } from "../../audit/audit.service";
import type { AuthenticatedRequest } from "../request.types";

const CODE_BY_STATUS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "validation_error",
  [HttpStatus.UNAUTHORIZED]: "unauthorized",
  [HttpStatus.FORBIDDEN]: "forbidden",
  [HttpStatus.NOT_FOUND]: "not_found",
  [HttpStatus.CONFLICT]: "conflict",
  [HttpStatus.PAYLOAD_TOO_LARGE]: "payload_too_large",
  [HttpStatus.TOO_MANY_REQUESTS]: "rate_limited",
  [HttpStatus.SERVICE_UNAVAILABLE]: "service_unavailable",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

@Catch()
@Injectable()
export class ApiExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(APP_LOGGER) private readonly logger: Logger,
    private readonly audit: AuditService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<AuthenticatedRequest>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;
    const path = request.originalUrl.split("?")[0] ?? request.originalUrl;

    // Guards run before interceptors, so auth failures never reach the audit
    // interceptor. Record them here exactly once; controller failures were
    // already recorded by the interceptor.
    if (
      (status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN) &&
      !request.auditIntercepted
    ) {
      void this.audit.record({
        action: status === HttpStatus.UNAUTHORIZED ? "auth.unauthenticated" : "authz.denied",
        outcome: "failure",
        resourceType: "auth",
        resourceId: path,
        requestId: request.id,
        actorId: request.user?.id,
        actorRole: request.user?.role,
        statusCode: status,
        source: "api",
        metadata: { method: request.method, path },
      });
    }

    let code = CODE_BY_STATUS[status] ?? (status >= 500 ? "internal_error" : "request_failed");
    let message = status >= 500 ? "Internal server error" : "Request failed";
    let details: unknown;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (isRecord(body)) {
        if (typeof body.code === "string") code = body.code;
        if (typeof body.message === "string") {
          message = body.message;
        } else if (Array.isArray(body.message)) {
          message = "Request validation failed";
          details = body.message;
        }
        if (body.details !== undefined) details = body.details;
      }
    }

    if (status >= 500) {
      this.logger.error(
        { err: exception, requestId: request.id, path: request.originalUrl.split("?")[0] },
        "unhandled_api_error",
      );
    }

    const payload: ApiErrorBody = {
      error: {
        code,
        message,
        requestId: request.id,
        ...(details !== undefined ? { details } : {}),
      },
    };

    response.status(status).json(payload);
  }
}
