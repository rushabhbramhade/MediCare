import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  type NestInterceptor,
} from "@nestjs/common";
import { tap, type Observable } from "rxjs";
import { AuditService } from "../../audit/audit.service";
import type { AuthenticatedRequest } from "../request.types";

/**
 * Records who called which route and the result. Query strings and bodies are
 * deliberately excluded because they can contain health information.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const response = http.getResponse<{ statusCode: number }>();
    const startedAt = Date.now();
    const action = `${request.method} ${request.originalUrl.split("?")[0] ?? request.originalUrl}`;

    const base = {
      action,
      requestId: request.id,
      userId: request.user?.id,
      role: request.user?.role,
    };

    return next.handle().pipe(
      tap({
        next: () => {
          this.audit.record({
            ...base,
            outcome: "success",
            statusCode: response.statusCode,
            durationMs: Date.now() - startedAt,
          });
        },
        error: (error: unknown) => {
          this.audit.record({
            ...base,
            outcome: "failure",
            statusCode: error instanceof HttpException ? error.getStatus() : 500,
            durationMs: Date.now() - startedAt,
          });
        },
      }),
    );
  }
}
