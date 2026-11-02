import type { AuthUser } from "@medicare/types";
import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";

@ApiTags("auth")
@ApiBearerAuth()
@Controller("auth")
export class AuthController {
  @Get("me")
  @ApiOperation({ summary: "Return the authenticated Medicare user" })
  @ApiOkResponse({ description: "Identity and application role from the verified token" })
  me(@CurrentUser() user: AuthUser): { user: AuthUser } {
    return { user };
  }
}
