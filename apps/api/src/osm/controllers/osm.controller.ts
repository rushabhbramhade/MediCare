import {
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
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
import { Throttle } from "@nestjs/throttler";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard";
import { OsmOverpassService } from "../services/osm-overpass.service";
import {
  osmHospitalsQuerySchema,
  osmPharmaciesQuerySchema,
  type OsmDiscoveryResponse,
  type OsmHospitalsQuery,
  type OsmPharmaciesQuery,
} from "../dto";

@ApiTags("osm")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Missing or invalid access token" })
@UseGuards(SupabaseAuthGuard)
@Controller("osm")
export class OsmController {
  constructor(private readonly osm: OsmOverpassService) {}

  @Get("hospitals")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Search hospitals near a point via OpenStreetMap Overpass API",
    description:
      "Returns OpenStreetMap hospital features near the given coordinates. " +
      "All results are unverified (verificationStatus: 'unverified') and " +
      "bed availability is always 'unknown'. OSM is not a verified medical directory.",
  })
  @ApiQuery({ name: "latitude", required: true, example: 18.5204 })
  @ApiQuery({ name: "longitude", required: true, example: 73.8567 })
  @ApiQuery({ name: "radiusMeters", required: false, example: 5000 })
  @ApiOkResponse({ description: "OpenStreetMap hospital results" })
  @ApiBadRequestResponse({ description: "Invalid coordinates or radius" })
  @ApiServiceUnavailableResponse({ description: "Overpass API is unavailable" })
  async searchHospitals(
    @Query(new ZodValidationPipe(osmHospitalsQuerySchema)) query: OsmHospitalsQuery,
  ): Promise<OsmDiscoveryResponse> {
    return this.osm.searchHospitals(query);
  }

  @Get("pharmacies")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Search pharmacies near a point via OpenStreetMap Overpass API",
    description:
      "Returns OpenStreetMap pharmacy features near the given coordinates. " +
      "All results are unverified and medicine inventory is always 'unknown'.",
  })
  @ApiQuery({ name: "latitude", required: true, example: 18.5204 })
  @ApiQuery({ name: "longitude", required: true, example: 73.8567 })
  @ApiQuery({ name: "radiusMeters", required: false, example: 5000 })
  @ApiOkResponse({ description: "OpenStreetMap pharmacy results" })
  @ApiBadRequestResponse({ description: "Invalid coordinates or radius" })
  @ApiServiceUnavailableResponse({ description: "Overpass API is unavailable" })
  async searchPharmacies(
    @Query(new ZodValidationPipe(osmPharmaciesQuerySchema)) query: OsmPharmaciesQuery,
  ): Promise<OsmDiscoveryResponse> {
    return this.osm.searchPharmacies(query);
  }
}
