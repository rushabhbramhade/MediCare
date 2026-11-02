import type { ApiEnv } from "@medicare/config";
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { APP_ENV } from "../../config/env";
import type { AuthenticatedRequest } from "../../common/request.types";

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Auth-specific in-memory fixed-window limiter. The global throttler uses
 * RATE_LIMIT_LIMIT; authentication routes use the stricter
 * AUTH_RATE_LIMIT_LIMIT. Per-instance only: a multi-instance deployment needs a
 * shared store (Redis) to enforce the same limit across replicas.
 */
@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, Window>();

  constructor(@Inject(APP_ENV) private readonly env: ApiEnv) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const key = request.user?.id ?? request.ip ?? "unknown";
    const now = Date.now();

    if (this.windows.size > 10_000) {
      for (const [id, window] of this.windows) {
        if (window.resetAt <= now) this.windows.delete(id);
      }
    }

    const window = this.windows.get(key);
    if (!window || window.resetAt <= now) {
      this.windows.set(key, { count: 1, resetAt: now + this.env.RATE_LIMIT_TTL_MS });
      return true;
    }

    if (window.count >= this.env.AUTH_RATE_LIMIT_LIMIT) {
      throw new HttpException(
        {
          code: "auth_rate_limited",
          message: "Too many authentication attempts. Wait a minute and try again.",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    window.count += 1;
    return true;
  }
}
