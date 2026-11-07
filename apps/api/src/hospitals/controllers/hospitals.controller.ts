import type {
  HospitalDetailResponse,
  HospitalSearchResponse,
} from "@medicare/types";
import {
  hospitalIdSchema,
  hospitalSearchSchema,
  type HospitalSearchInput,
} from "@medicare/validators";
import { Controller, Get, Param, Query } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
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
    summary: "Search hospitals near a point",
    description:
      "Returns an explicit NO_DATA_SOURCE_CONFIGURED status when no licensed provider is configured. Reported availability is returned only from app.hospital_availability rows, with source and timestamp. Bed availability is never inferred.",
  })
  @ApiQuery({ name: "latitude", required: true, example: 19.076 })
  @ApiQuery({ name: "longitude", required: true, example: 72.8777 })
  @ApiQuery({ name: "q", required: false, example: "Manipal" })
  @ApiQuery({
    name: "bbox",
    required: false,
    example: "72.8,19.0,72.94,19.14",
    description: "Viewport filter: minLng,minLat,maxLng,maxLat. Replaces the radius filter.",
  })
  @ApiQuery({ name: "radiusKm", required: false, example: 10 })
  @ApiQuery({ name: "specialty", required: false, example: "cardiology" })
  @ApiQuery({ name: "emergencyOnly", required: false, example: false })
  @ApiQuery({
    name: "emergency",
    required: false,
    example: false,
    description: "Alias for emergencyOnly.",
  })
  @ApiQuery({ name: "availableBeds", required: false, example: false })
  @ApiQuery({ name: "icuAvailable", required: false, example: false })
  @ApiQuery({ name: "open24x7", required: false, example: false })
  @ApiQuery({ name: "ambulanceAvailable", required: false, example: false })
  @ApiQuery({ name: "hospitalType", required: false, example: "private" })
  @ApiQuery({
    name: "ownershipType",
    required: false,
    example: "private",
    description: "Alias for hospitalType.",
  })
  @ApiQuery({ name: "page", required: false, example: 1 })
  @ApiQuery({ name: "pageSize", required: false, example: 20 })
  @ApiOkResponse({ description: "Search result, possibly with zero verified hospitals" })
  @ApiBadRequestResponse({ description: "Invalid coordinates, bbox, radius or pagination" })
  @ApiServiceUnavailableResponse({ description: "The provider database is unreachable" })
  search(
    @Query(new ZodValidationPipe(hospitalSearchSchema)) query: HospitalSearchInput,
  ): Promise<HospitalSearchResponse> {
    return this.hospitals.search(query);
  }

  @Get("nearby")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Discover hospitals near a point",
    description: "Convenience alias of the hospital search with a smaller default page size.",
  })
  @ApiQuery({ name: "latitude", required: true, example: 19.076 })
  @ApiQuery({ name: "longitude", required: true, example: 72.8777 })
  @ApiQuery({ name: "radiusKm", required: false, example: 5 })
  @ApiOkResponse({ description: "Nearby hospital result" })
  nearby(
    @Query(new ZodValidationPipe(hospitalSearchSchema)) query: HospitalSearchInput,
  ): Promise<HospitalSearchResponse> {
    return this.hospitals.search(query);
  }

  @Get(":id")
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: "Get one verified hospital with reported availability" })
  @ApiParam({ name: "id", description: "Hospital UUID" })
  @ApiOkResponse({ description: "Hospital detail" })
  @ApiBadRequestResponse({ description: "Invalid hospital id" })
  @ApiNotFoundResponse({ description: "Hospital not found or inactive" })
  getById(
    @Param("id", new ZodValidationPipe(hospitalIdSchema)) id: string,
  ): Promise<HospitalDetailResponse> {
    return this.hospitals.getById(id).then((hospital) => ({ hospital }));
  }
}
