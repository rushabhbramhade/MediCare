import { Controller, Get, Query } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ServiceAudited } from "../common/decorators/service-audited.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import type { AuthUser } from "@medicare/types";
import { DashboardService } from "./dashboard.service";
import {
  dashboardOverviewSchema,
  type DashboardOverviewQuery,
  type DashboardOverviewResponse,
} from "./dashboard.dto";

@ApiTags("dashboard")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Missing or invalid access token" })
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get("overview")
  @Roles("patient")
  @ServiceAudited()
  @ApiOperation({
    summary: "Get the authenticated patient's dashboard overview",
    description:
      "Aggregates profile, nearby hospitals with capacity, emergency numbers, " +
      "and honest empty states for not-yet-connected services. " +
      "Never returns fabricated data.",
  })
  @ApiQuery({ name: "latitude", required: false, example: 18.5204 })
  @ApiQuery({ name: "longitude", required: false, example: 73.8567 })
  @ApiQuery({ name: "radiusKm", required: false, example: 5 })
  @ApiOkResponse({ description: "Dashboard overview with real or honest-empty data" })
  async overview(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(dashboardOverviewSchema)) query: DashboardOverviewQuery,
  ): Promise<DashboardOverviewResponse> {
    return this.dashboard.getOverview(user, query);
  }
}
