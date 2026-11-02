import type { Role } from "@medicare/types";
import { SetMetadata } from "@nestjs/common";

export const ROLES_KEY = "medicare:roles";

/** Requires at least one of the listed roles. `admin` always passes RolesGuard. */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
