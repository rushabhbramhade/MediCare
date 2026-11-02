import type { ApiEnv } from "@medicare/config";
import { ROLES, type AuthUser, type Role } from "@medicare/types";
import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt, { type JwtPayload } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { APP_ENV } from "../../config/env";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Maps verified Supabase claims to an application user.
 * Roles come only from `app_metadata` (admin-controlled), never `user_metadata`.
 */
export function mapClaimsToUser(payload: JwtPayload): AuthUser {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new UnauthorizedException("Access token is missing a subject");
  }

  const appMetadata = isRecord(payload.app_metadata) ? payload.app_metadata : {};
  const role: Role = isRole(appMetadata.role) ? appMetadata.role : "patient";

  const user: AuthUser = { id: payload.sub, role };
  if (typeof payload.email === "string") user.email = payload.email;
  if (typeof payload.phone === "string") user.phone = payload.phone;
  return user;
}

@Injectable()
export class AuthService {
  private readonly jwks: ReturnType<typeof jwksClient>;

  constructor(@Inject(APP_ENV) private readonly env: ApiEnv) {
    this.jwks = jwksClient({
      jwksUri: env.JWT_JWKS_URL,
      cache: true,
      cacheMaxEntries: 10,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = await new Promise<JwtPayload>((resolve, reject) => {
        jwt.verify(
          token,
          (header, callback) => {
            this.jwks.getSigningKey(header.kid, (error, key) => {
              if (error || !key) {
                callback(error ?? new Error("No signing key for token"));
                return;
              }
              callback(null, key.getPublicKey());
            });
          },
          {
            algorithms: ["RS256", "ES256"],
            issuer: this.env.JWT_ISSUER,
            audience: this.env.JWT_AUDIENCE,
          },
          (error, payload) => {
            if (error) {
              reject(error);
            } else if (typeof payload === "string" || payload === undefined) {
              reject(new Error("Unexpected token payload"));
            } else {
              resolve(payload);
            }
          },
        );
      });

      return mapClaimsToUser(decoded);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      // Never include the token or verifier internals in the client response.
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
}
