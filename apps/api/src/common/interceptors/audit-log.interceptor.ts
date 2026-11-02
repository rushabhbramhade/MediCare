import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { catchError, concatMap, type Observable } from "rxjs";
import { AuditService } from "../../audit/audit.service";
import { SERVICE_AUDITED_KEY } from "../decorators/service-audited.decorator";
import type { AuthenticatedRequest } from "../request.types";

/**
 * Records who called which route and the result. Query strings and bodies are
 * deliberately excluded because they can contain health information.
 *
 * Success events for routes marked @ServiceAudited() are skipped; those services
 * write a richer event themselves. Failure events are still recorded here,
 * because a rolled-back mutation has no persisted service event.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(
    private readonly audit: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();
    const path = request.originalUrl.split("?")[0] ?? request.originalUrl;
    const action = `${request.method} ${path}`;
    const serviceAudited =
      this.reflector.getAllAndOverride<boolean>(SERVICE_AUDITED_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) === true;

    request.auditIntercepted = true;

    const base = {
      action,
      resourceType: "http_request",
      resourceId: path,
      requestId: request.id,
      actorId: request.user?.id,
      actorRole: request.user?.role,
      source: "api",
      metadata: { method: request.method, path },
    };

    return next.handle().pipe(
      concatMap(async (value) => {
        if (!serviceAudited && request.user) {
          await this.audit.record({
            ...base,
            outcome: "success",
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          });
        }
        return value;
      }),
      catchError(async (error: unknown) => {
        if (request.user) {
          await this.audit.record({
            ...base,
            outcome: "failure",
            statusCode: error instanceof HttpException ? error.getStatus() : 500,
            durationMs: Date.now() - startedAt,
          });
        }
        throw error;
      }),
    );
  }
}
