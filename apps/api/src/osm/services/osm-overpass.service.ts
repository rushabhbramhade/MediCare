import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { ApiEnv } from "../../config/env";
import { APP_ENV } from "../../config/env";
import { APP_LOGGER } from "../../common/logger";
import { RedisService } from "../../redis/redis.service";
import type {
  OsmDiscoveryResponse,
  OsmHospitalsQuery,
  OsmPharmaciesQuery,
  OsmPlaceResult,
  OverpassElement,
  OverpassResponse,
} from "../dto";

const OVERPASS_QUERY_TEMPLATE = (
  featureType: string,
  lat: number,
  lng: number,
  radiusMeters: number,
) => `[out:json][timeout:${30}];(
  node["amenity"="${featureType}"](around:${radiusMeters},${lat},${lng});
  way["amenity"="${featureType}"](around:${radiusMeters},${lat},${lng});
  relation["amenity"="${featureType}"](around:${radiusMeters},${lat},${lng});
);
out center tags;`;

/**
 * OpenStreetMap Overpass API discovery service.
 *
 * Queries the public Overpass API for hospitals and pharmacies near a
 * point. Results are cached in Redis and carry OpenStreetMap attribution.
 *
 * CRITICAL: OSM data is never verified. All results are marked
 * `verificationStatus: "unverified"` and `bedAvailability: "unknown"`.
 * OSM is not a medical directory and must never be represented as
 * verified or currently operational.
 */
@Injectable()
export class OsmOverpassService {
  private readonly logger = new Logger(OsmOverpassService.name);

  constructor(
    @Inject(APP_ENV) private readonly env: ApiEnv,
    @Inject(APP_LOGGER) _logger: Logger,
    private readonly redis: RedisService,
  ) {}

  private get overpassUrl(): string {
    return this.env.OSM_OVERPASS_API_URL ?? "https://overpass-api.de/api/interpreter";
  }

  private get timeoutSeconds(): number {
    return this.env.OSM_OVERPASS_TIMEOUT_SECONDS ?? 30;
  }

  private get cacheTtlSeconds(): number {
    return this.env.OSM_CACHE_TTL_SECONDS ?? 3600;
  }

  /**
   * Build a Redis cache key for an Overpass query.
   * Coordinates are rounded to 4 decimal places (~11m precision) to
   * improve cache hit rates for nearby searches.
   */
  private cacheKey(featureType: string, query: OsmHospitalsQuery | OsmPharmaciesQuery): string {
    const lat = Math.round(query.latitude * 10000) / 10000;
    const lng = Math.round(query.longitude * 10000) / 10000;
    return `osm:overpass:${featureType}:${lat}:${lng}:${query.radiusMeters}`;
  }

  /**
   * Fetch from the Overpass API with a hard timeout.
   * The Overpass API requires no API key.
   */
  private async fetchOverpass(featureType: string, lat: number, lng: number, radiusMeters: number): Promise<OverpassResponse> {
    const query = OVERPASS_QUERY_TEMPLATE(featureType, lat, lng, radiusMeters);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutSeconds * 1000);

    try {
      const response = await fetch(this.overpassUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: query }),
        signal: controller.signal,
      });

      if (!response.ok) {
        this.logger.warn(
          { status: response.status, featureType },
          "overpass_api_non_ok",
        );
        throw new ServiceUnavailableException({
          code: "overpass_api_error",
          message: `OpenStreetMap Overpass API returned ${response.status}`,
        });
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableException({
          code: "overpass_api_timeout",
          message: `OpenStreetMap Overpass API request timed out after ${this.timeoutSeconds}s`,
        });
      }
      this.logger.warn({ err: error, featureType }, "overpass_api_request_failed");
      throw new ServiceUnavailableException({
        code: "overpass_api_request_failed",
        message: "OpenStreetMap Overpass API request failed",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Parse Overpass elements into normalized place results.
   * All results are unverified with unknown bed availability.
   */
  private parseElements(
    elements: OverpassResponse["elements"],
    featureType: string,
    lat: number,
    lng: number,
  ): OsmPlaceResult[] {
    const now = new Date().toISOString();

    return elements.map((el: OverpassElement) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;

      if (elLat === undefined || elLng === undefined) {
        // Elements without geometry cannot be mapped.
        return null;
      }

      const tags = el.tags;
      const name = tags.name || null;
      const distanceKm = this.haversineKm(lat, lng, elLat, elLng);

      return {
        id: `osm:${el.type}:${el.id}`,
        name,
        addressLine: tags["addr:housenumber"] && tags["addr:street"]
          ? `${tags["addr:housenumber"]} ${tags["addr:street"]}`
          : tags["addr:street"] ?? null,
        city: tags["addr:city"] ?? null,
        state: tags["addr:state"] ?? null,
        postalCode: tags["addr:postcode"] ?? null,
        latitude: elLat,
        longitude: elLng,
        distanceKm: Math.round(distanceKm * 100) / 100,
        hasEmergency: null,
        phone: tags.phone ?? null,
        featureType,
        operationalStatus: "unknown",
        source: "openstreetmap",
        lastSyncedAt: now,
        verificationStatus: "unverified",
        bedAvailability: "unknown",
      };
    }).filter(Boolean) as OsmPlaceResult[];
  }

  /** Haversine great-circle distance in kilometres. */
  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  /**
   * Search hospitals near a point via OpenStreetMap Overpass API.
   * Results are cached in Redis with a TTL.
   */
  async searchHospitals(query: OsmHospitalsQuery): Promise<OsmDiscoveryResponse> {
    return this.search("hospital", query);
  }

  /**
   * Search pharmacies near a point via OpenStreetMap Overpass API.
   * Results are cached in Redis with a TTL.
   */
  async searchPharmacies(query: OsmPharmaciesQuery): Promise<OsmDiscoveryResponse> {
    return this.search("pharmacy", query);
  }

  private async search(
    featureType: "hospital" | "pharmacy",
    query: OsmHospitalsQuery | OsmPharmaciesQuery,
  ): Promise<OsmDiscoveryResponse> {
    const key = this.cacheKey(featureType, query);

    // Try cache first.
    try {
      const cached = await this.redis.connection.get(key);
      if (cached) {
        this.logger.debug({ cacheKey: key, featureType }, "overpass_cache_hit");
        return JSON.parse(cached) as OsmDiscoveryResponse;
      }
    } catch (error) {
      // Redis failure should not block the request — fall through to fetch.
      this.logger.warn({ err: error, cacheKey: key }, "overpass_cache_read_failed");
    }

    // Fetch from Overpass API.
    const overpass = await this.fetchOverpass(
      featureType,
      query.latitude,
      query.longitude,
      query.radiusMeters,
    );

    const places = this.parseElements(
      overpass.elements,
      featureType,
      query.latitude,
      query.longitude,
    );

    // Sort by distance.
    places.sort((a, b) => a.distanceKm - b.distanceKm);

    const now = new Date().toISOString();
    const response: OsmDiscoveryResponse = {
      places,
      total: places.length,
      radiusMeters: query.radiusMeters,
      source: "openstreetmap",
      lastSyncedAt: now,
    };

    // Write to cache (best effort, non-blocking).
    try {
      await this.redis.connection.setex(key, this.cacheTtlSeconds, JSON.stringify(response));
    } catch (error) {
      this.logger.warn({ err: error, cacheKey: key }, "overpass_cache_write_failed");
    }

    return response;
  }
}
