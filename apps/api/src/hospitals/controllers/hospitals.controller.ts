import type { HospitalSearchResponse } from "@medicare/types";
import { hospitalSearchSchema, type HospitalSearchInput } from "@medicare/validators";
import { Controller, Get, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { HospitalsService } from "../services/hospitals.service";

@ApiTags("hospitals")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Missing or invalid access token" })
@Controller("hospitals")
export class HospitalsController {
  constructor(private readonly hospitals: HospitalsService) {}

  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Search verified hospitals near a point",
    description:
      "Returns an explicit NO_DATA_SOURCE_CONFIGURED status when no licensed provider is configured. Bed availability is always unknown until a verified live source exists.",
  })
  @ApiQuery({ name: "latitude", required: true, example: 19.076 })
  @ApiQuery({ name: "longitude", required: true, example: 72.8777 })
  @ApiQuery({ name: "radiusKm", required: false, example: 10 })
  @ApiQuery({ name: "specialty", required: false, example: "cardiology" })
  @ApiQuery({ name: "emergencyOnly", required: false, example: false })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, example: 20 })
  @ApiOkResponse({ description: "Search result, possibly with zero verified hospitals" })
  @ApiBadRequestResponse({ description: "Invalid coordinates, radius or pagination" })
  @ApiServiceUnavailableResponse({ description: "The provider database is unreachable" })
  search(
    @Query(new ZodValidationPipe(hospitalSearchSchema)) query: HospitalSearchInput,
  ): Promise<HospitalSearchResponse> {
    return this.hospitals.search(query);
  }
}
