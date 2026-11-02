import type { AuthUser } from "@medicare/types";
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { AuthRateLimitGuard } from "../guards/auth-rate-limit.guard";

@ApiTags("auth")
@ApiBearerAuth()
@UseGuards(AuthRateLimitGuard)
@Controller("auth")
export class AuthController {
  @Get("me")
  @ApiOperation({ summary: "Return the authenticated Medicare user" })
  @ApiOkResponse({ description: "Identity and application role from the verified token" })
  me(@CurrentUser() user: AuthUser): { user: AuthUser } {
    return { user };
  }
}
