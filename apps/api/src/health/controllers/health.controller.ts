import type { HealthResponse, ReadinessResponse } from "@medicare/contracts";
import { Controller, Get, HttpStatus, Res } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
import { Public } from "../../common/decorators/public.decorator";
import { HealthService } from "../services/health.service";

@ApiTags("health")
@Public()
@Controller("health")
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Get()
  @ApiOperation({ summary: "Liveness probe" })
  @ApiOkResponse({ description: "The API process is running" })
  liveness(): HealthResponse {
    return this.health.liveness();
  }

  @Get("ready")
  @ApiOperation({ summary: "Readiness probe (database and Redis)" })
  @ApiOkResponse({ description: "All dependencies are reachable" })
  @ApiServiceUnavailableResponse({ description: "One or more dependencies are unreachable" })
  async readiness(@Res({ passthrough: true }) response: Response): Promise<ReadinessResponse> {
    const result = await this.health.readiness();
    if (result.status !== "ok") response.status(HttpStatus.SERVICE_UNAVAILABLE);
    return result;
  }
}
