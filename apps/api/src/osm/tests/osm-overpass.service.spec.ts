import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ServiceUnavailableException, type Logger } from "@nestjs/common";
import { OsmOverpassService } from "../services/osm-overpass.service";

const logger = {
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
  verbose: vi.fn(),
} as unknown as Logger;

const baseEnv = {
  NODE_ENV: "development",
  LOG_LEVEL: "info",
  OSM_OVERPASS_API_URL: "https://overpass-api.de/api/interpreter",
  OSM_OVERPASS_TIMEOUT_SECONDS: 30,
  OSM_CACHE_TTL_SECONDS: 3600,
};

interface RedisMock {
  get: ReturnType<typeof vi.fn>;
  setex: ReturnType<typeof vi.fn>;
}

function createRedisMock(): RedisMock {
  return {
    get: vi.fn(),
    setex: vi.fn(),
  };
}

function createService(
  envOverrides: Partial<typeof baseEnv> = {},
) {
  const mergedEnv = { ...baseEnv, ...envOverrides };
  const redis = createRedisMock();
  const service = new OsmOverpassService(
    mergedEnv as never,
    logger,
    { connection: redis } as never,
  );
  return { service, redis };
}

const mockFetch = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OsmOverpassService", () => {
  describe("searchHospitals", () => {
    it("returns parsed hospital results from Overpass API", async () => {
      const { service } = createService();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "node",
              id: 12345,
              lat: 18.521,
              lon: 73.857,
              tags: {
                name: "City Hospital",
                amenity: "hospital",
                "addr:street": "Main Road",
                phone: "+91 22 1234 5678",
              },
            },
            {
              type: "way",
              id: 67890,
              center: { lat: 18.525, lon: 73.86 },
              tags: {
                name: "General Hospital",
                amenity: "hospital",
              },
            },
          ],
        }),
      });

      const result = await service.searchHospitals({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(result.source).toBe("openstreetmap");
      expect(result.total).toBe(2);
      expect(result.places[0]).toMatchObject({
        id: "osm:node:12345",
        name: "City Hospital",
        featureType: "hospital",
        source: "openstreetmap",
        verificationStatus: "unverified",
        bedAvailability: "unknown",
        hasEmergency: null,
        operationalStatus: "unknown",
      });
      expect(result.places[1]).toMatchObject({
        id: "osm:way:67890",
        name: "General Hospital",
        featureType: "hospital",
        verificationStatus: "unverified",
        bedAvailability: "unknown",
      });
      // Results sorted by distance
      const d0 = result.places[0]?.distanceKm;
      const d1 = result.places[1]?.distanceKm;
      expect(d0).toBeDefined();
      expect(d1).toBeDefined();
      if (d0 !== undefined && d1 !== undefined) {
        expect(d0).toBeLessThanOrEqual(d1);
      }
    });

    it("returns empty results when Overpass returns no elements", async () => {
      const { service } = createService();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      const result = await service.searchHospitals({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(result.total).toBe(0);
      expect(result.places).toEqual([]);
    });

    it("throws ServiceUnavailableException on Overpass API error", async () => {
      const { service } = createService();
      mockFetch.mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => ({}),
      });

      await expect(
        service.searchHospitals({
          latitude: 18.5204,
          longitude: 73.8567,
          radiusMeters: 5000,
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it("throws ServiceUnavailableException on fetch timeout", async () => {
      const { service } = createService({ OSM_OVERPASS_TIMEOUT_SECONDS: 1 });
      const abortError = new Error("The operation timed out") as Error & { name: string };
      abortError.name = "AbortError";
      mockFetch.mockRejectedValue(abortError);

      await expect(
        service.searchHospitals({
          latitude: 18.5204,
          longitude: 73.8567,
          radiusMeters: 5000,
        }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it("skips elements without geometry", async () => {
      const { service } = createService();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "node",
              id: 999,
              tags: { name: "No Geometry Hospital", amenity: "hospital" },
            },
            {
              type: "node",
              id: 100,
              lat: 18.521,
              lon: 73.857,
              tags: { name: "Real Hospital", amenity: "hospital" },
            },
          ],
        }),
      });

      const result = await service.searchHospitals({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(result.total).toBe(1);
      expect(result.places[0]?.id).toBe("osm:node:100");
    });
  });

  describe("searchPharmacies", () => {
    it("returns parsed pharmacy results from Overpass API", async () => {
      const { service } = createService();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          elements: [
            {
              type: "node",
              id: 55555,
              lat: 18.522,
              lon: 73.858,
              tags: {
                name: "MediCare Pharmacy",
                amenity: "pharmacy",
              },
            },
          ],
        }),
      });

      const result = await service.searchPharmacies({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(result.source).toBe("openstreetmap");
      expect(result.total).toBe(1);
      expect(result.places[0]).toMatchObject({
        id: "osm:node:55555",
        name: "MediCare Pharmacy",
        featureType: "pharmacy",
        verificationStatus: "unverified",
        bedAvailability: "unknown",
      });
    });
  });

  describe("cache", () => {
    it("returns cached result when available", async () => {
      const { service, redis } = createService();
      const cached = {
        places: [],
        total: 0,
        radiusMeters: 5000,
        source: "openstreetmap",
        lastSyncedAt: "2026-01-01T00:00:00.000Z",
      };
      redis.get.mockResolvedValue(JSON.stringify(cached));

      const result = await service.searchHospitals({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(result).toEqual(cached);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("falls through to Overpass API when cache read fails", async () => {
      const { service, redis } = createService();
      redis.get.mockRejectedValue(new Error("redis down"));
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      const result = await service.searchHospitals({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(result.total).toBe(0);
      expect(mockFetch).toHaveBeenCalled();
    });

    it("writes result to cache after fetch", async () => {
      const { service, redis } = createService();
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ elements: [] }),
      });

      await service.searchHospitals({
        latitude: 18.5204,
        longitude: 73.8567,
        radiusMeters: 5000,
      });

      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringContaining("osm:overpass:hospital:"),
        3600,
        expect.stringContaining('"total":0'),
      );
    });
  });
});
