import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { Logger } from "pino";
import { APP_LOGGER } from "../../common/logger";
import { APP_ENV, type ApiEnv } from "../../config/env";
import type {
  GeocodeRequest,
  GeocodeResponse,
  Place,
  PlacesSearchRequest,
  PlacesSearchResponse,
  ReverseGeocodeRequest,
  ReverseGeocodeResponse,
  RouteRequest,
  RouteResponse,
} from "../dto/geocode.dto";
/**
 * Server-only Google Maps Platform client.
 *
 * All calls are made from the NestJS backend; the browser never sees
 * GOOGLE_MAPS_SERVER_API_KEY. API keys are redacted from logs.
 *
 * Wraps:
 *  - Geocoding API (address <-> coordinates)
 *  - Places API (New) Text Search (hospitals / pharmacies)
 *  - Routes API (distance + ETA)
 */
@Injectable()
export class GoogleMapsService {
  private readonly base = "https://maps.googleapis.com/maps/api";
  private readonly placesBase = "https://places.googleapis.com/v1";
  private readonly timeoutMs = 10_000;

  constructor(
    @Inject(APP_ENV) private readonly env: ApiEnv,
    @Inject(APP_LOGGER) private readonly logger: Logger,
  ) {
    if (!env.GOOGLE_MAPS_SERVER_API_KEY) {
      throw new ServiceUnavailableException({
        code: "google_maps_not_configured",
        message: "Google Maps Platform is not configured on the server",
      });
    }
  }

  private get apiKey(): string {
    return this.env.GOOGLE_MAPS_SERVER_API_KEY!;
  }

  /**
   * Fetch with a hard timeout and safe error surfacing. The API key is never
   * included in log messages.
   */
  private async fetchJson<T>(
    url: string,
    init: RequestInit,
    label: string,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      if (!response.ok) {
        this.logger.warn(
          { status: response.status, label },
          "google_maps_request_failed",
        );
        throw new ServiceUnavailableException({
          code: "google_maps_request_failed",
          message: `Google Maps ${label} request failed`,
        });
      }
      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.warn({ label, err: error }, "google_maps_request_error");
      throw new ServiceUnavailableException({
        code: "google_maps_request_error",
        message: `Google Maps ${label} request failed`,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Forward geocode: address -> coordinates. */
  async geocode(request: GeocodeRequest): Promise<GeocodeResponse> {
    const params = new URLSearchParams({
      address: request.address,
      key: this.apiKey,
      region: this.env.GOOGLE_MAPS_REGION,
      language: this.env.GOOGLE_MAPS_LANGUAGE,
    });

    const data = await this.fetchJson<{
      results: Array<{
        place_id: string;
        formatted_address: string;
        geometry: { location: { lat: number; lng: number } };
      }>;
      status: string;
    }>(
      `${this.base}/geocode/json?${params}`,
      {},
      "geocode",
    );

    if (data.status !== "OK" || !data.results?.[0]) {
      this.logger.warn(
        { status: data.status, label: "geocode" },
        "google_maps_no_results",
      );
      throw new ServiceUnavailableException({
        code: "google_maps_no_results",
        message: "No geocoding results found for that address",
      });
    }

    const result = data.results[0];
    return {
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
    };
  }

  /** Reverse geocode: coordinates -> address. */
  async reverseGeocode(
    request: ReverseGeocodeRequest,
  ): Promise<ReverseGeocodeResponse> {
    const params = new URLSearchParams({
      latlng: `${request.latitude},${request.longitude}`,
      key: this.apiKey,
      region: this.env.GOOGLE_MAPS_REGION,
      language: this.env.GOOGLE_MAPS_LANGUAGE,
    });

    const data = await this.fetchJson<{
      results: Array<{
        place_id: string;
        formatted_address: string;
      }>;
      status: string;
    }>(
      `${this.base}/geocode/json?${params}`,
      {},
      "reverse-geocode",
    );

    if (data.status !== "OK" || !data.results?.[0]) {
      this.logger.warn(
        { status: data.status, label: "reverse-geocode" },
        "google_maps_no_results",
      );
      throw new ServiceUnavailableException({
        code: "google_maps_no_results",
        message: "No address found for those coordinates",
      });
    }

    const result = data.results[0];
    return {
      placeId: result.place_id,
      formattedAddress: result.formatted_address,
    };
  }

  /**
   * Places API (New) Text Search for hospitals or pharmacies near a point.
   * Results are bounded by location + radius restriction as required.
   */
  async searchPlaces(request: PlacesSearchRequest): Promise<PlacesSearchResponse> {
    const body = {
      textQuery: request.query,
      locationBias: {
        circle: {
          center: { latitude: request.latitude, longitude: request.longitude },
          radius: Math.round(request.radiusKm * 1_000),
        },
      },
      ...(request.type ? { includedTypes: [request.type] } : {}),
      languageCode: this.env.GOOGLE_MAPS_LANGUAGE,
      regionCode: this.env.GOOGLE_MAPS_REGION,
    };

    const data = await this.fetchJson<{
      places: Array<{
        id: string;
        displayName: { text: string };
        formattedAddress?: string;
        location: { latitude: number; longitude: number };
        rating?: number;
        types: string[];
      }>;
    }>(
      `${this.placesBase}/places:searchText`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": [
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.location",
            "places.rating",
            "places.types",
          ].join(","),
        },
        body: JSON.stringify(body),
      },
      "places-search",
    );

    return {
      places: (data.places ?? []).map((p): Place => ({
        placeId: p.id,
        name: p.displayName?.text ?? "",
        formattedAddress: p.formattedAddress ?? undefined,
        latitude: p.location.latitude,
        longitude: p.location.longitude,
        rating: p.rating ?? null,
        types: p.types ?? [],
      })),
    };
  }

  /**
   * Routes API: compute distance and ETA between two points.
   */
  async route(request: RouteRequest): Promise<RouteResponse> {
    const body = {
      origin: {
        location: {
          latLng: {
            latitude: request.originLatitude,
            longitude: request.originLongitude,
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: request.destinationLatitude,
            longitude: request.destinationLongitude,
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
    };

    const data = await this.fetchJson<{
      routes: Array<{
        distanceMeters: number;
        duration: string;
      }>;
    }>(
      "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
          "X-Goog-FieldMask": ["originIndex", "destinationIndex", "distanceMeters", "duration"].join(
            ",",
          ),
        },
        body: JSON.stringify([body]),
      },
      "route",
    );

    const route = data.routes?.[0];
    if (!route) {
      this.logger.warn({ label: "route" }, "google_maps_no_route");
      throw new ServiceUnavailableException({
        code: "google_maps_no_route",
        message: "No route found between those points",
      });
    }

    // duration is a Duration string like "120s"
    const durationSeconds = parseDuration(route.duration);

    return {
      distanceMeters: Math.max(0, Math.round(route.distanceMeters ?? 0)),
      durationSeconds: Math.max(0, durationSeconds),
    };
  }
}

/**
 * Parse a Duration string like "120s" into seconds.
 */
function parseDuration(value: string | undefined): number {
  if (!value) return 0;
  const match = value.match(/^(\d+)s$/);
  return match ? Number(match[1]) : 0;
}
