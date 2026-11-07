import {
  Controller,
  Get,
  Post,
  Query,
  Body,
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
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { GoogleMapsService } from "../services/google-maps.service";
import {
  geocodeRequestSchema,
  placesSearchRequestSchema,
  reverseGeocodeRequestSchema,
  routeRequestSchema,
  type GeocodeResponse,
  type PlacesSearchResponse,
  type ReverseGeocodeResponse,
  type RouteResponse,
} from "../dto";

@ApiTags("map")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Missing or invalid access token" })
@Controller("map")
export class MapController {
  constructor(private readonly googleMaps: GoogleMapsService) {}

  @Get("geocode")
  @ApiOperation({
    summary: "Convert an address to coordinates",
    description:
      "Server-side call to the Google Geocoding API. The API key never reaches the browser.",
  })
  @ApiQuery({ name: "address", required: true, example: "Hinjewadi, Pune, Maharashtra" })
  @ApiOkResponse({ description: "Coordinates and formatted address" })
  @ApiBadRequestResponse({ description: "Invalid address" })
  @ApiServiceUnavailableResponse({ description: "Google Maps request failed" })
  async geocode(
    @Query(new ZodValidationPipe(geocodeRequestSchema)) query: { address: string },
  ): Promise<GeocodeResponse> {
    return this.googleMaps.geocode(query);
  }

  @Get("reverse-geocode")
  @ApiOperation({
    summary: "Convert coordinates to an address",
    description:
      "Server-side call to the Google Geocoding API. The API key never reaches the browser.",
  })
  @ApiQuery({ name: "latitude", required: true, example: 18.5204 })
  @ApiQuery({ name: "longitude", required: true, example: 73.8567 })
  @ApiOkResponse({ description: "Formatted address" })
  @ApiBadRequestResponse({ description: "Invalid coordinates" })
  @ApiServiceUnavailableResponse({ description: "Google Maps request failed" })
  async reverseGeocode(
    @Query(new ZodValidationPipe(reverseGeocodeRequestSchema)) query: {
      latitude: number;
      longitude: number;
    },
  ): Promise<ReverseGeocodeResponse> {
    return this.googleMaps.reverseGeocode(query);
  }

  @Get("places")
  @ApiOperation({
    summary: "Search hospitals or pharmacies near a point (Places API New)",
    description:
      "Server-side call to the Google Places API (New) Text Search. Results are limited by location and radius.",
  })
  @ApiQuery({ name: "query", required: true, example: "hospital" })
  @ApiQuery({ name: "latitude", required: true, example: 18.5204 })
  @ApiQuery({ name: "longitude", required: true, example: 73.8567 })
  @ApiQuery({ name: "radiusKm", required: false, example: 10 })
  @ApiQuery({ name: "type", required: false, enum: ["hospital", "pharmacy"] })
  @ApiOkResponse({ description: "Matching places" })
  @ApiBadRequestResponse({ description: "Invalid query or coordinates" })
  @ApiServiceUnavailableResponse({ description: "Google Maps request failed" })
  async searchPlaces(
    @Query(new ZodValidationPipe(placesSearchRequestSchema)) query: {
      query: string;
      latitude: number;
      longitude: number;
      radiusKm?: number;
      type?: "hospital" | "pharmacy";
    },
  ): Promise<PlacesSearchResponse> {
    return this.googleMaps.searchPlaces({
      ...query,
      radiusKm: query.radiusKm ?? 10,
    });
  }

  @Post("route")
  @ApiOperation({
    summary: "Get route distance and ETA between two points",
    description:
      "Server-side call to the Google Routes API (distance matrix). Returns driving distance and ETA.",
  })
  @ApiOkResponse({ description: "Route distance and duration" })
  @ApiBadRequestResponse({ description: "Invalid coordinates" })
  @ApiServiceUnavailableResponse({ description: "Google Maps request failed" })
  async route(
    @Body(new ZodValidationPipe(routeRequestSchema)) body: {
      originLatitude: number;
      originLongitude: number;
      destinationLatitude: number;
      destinationLongitude: number;
    },
  ): Promise<RouteResponse> {
    return this.googleMaps.route(body);
  }
}
