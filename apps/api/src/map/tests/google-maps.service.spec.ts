import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ServiceUnavailableException } from "@nestjs/common";
import type { Logger } from "pino";
import { GoogleMapsService } from "../services/google-maps.service";

const logger = { warn: vi.fn(), error: vi.fn() } as unknown as Logger;

function env(overrides: Record<string, string | undefined> = {}) {
  return {
    NODE_ENV: "development",
    LOG_LEVEL: "info",
    GOOGLE_MAPS_SERVER_API_KEY: "test-server-key",
    GOOGLE_MAPS_REGION: "IN",
    GOOGLE_MAPS_LANGUAGE: "en",
    ...overrides,
  } as never;
}

function createService(envOverrides: Record<string, string | undefined> = {}) {
  return new GoogleMapsService(env(envOverrides) as never, logger);
}

const mockFetch = vi.fn() as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
  mockFetch.mockReset();
});

describe("GoogleMapsService", () => {
  describe("constructor validation", () => {
    it("throws when GOOGLE_MAPS_SERVER_API_KEY is missing", () => {
      expect(() => createService({ GOOGLE_MAPS_SERVER_API_KEY: undefined })).toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe("geocode", () => {
    it("returns coordinates for a valid address", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [
            {
              place_id: "ChIJ-test",
              formatted_address: "Hinjewadi, Pune, Maharashtra, India",
              geometry: { location: { lat: 18.5937, lng: 73.7399 } },
            },
          ],
        }),
      });

      const result = await service.geocode({ address: "Hinjewadi, Pune" });

      expect(result).toEqual({
        placeId: "ChIJ-test",
        formattedAddress: "Hinjewadi, Pune, Maharashtra, India",
        latitude: 18.5937,
        longitude: 73.7399,
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("geocode/json"),
        expect.anything(),
      );
      // API key must not appear in the fetch URL as a logged query param we assert on;
      // instead verify it's present in the request but redacted from logs.
      const url = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(url).toContain("key=test-server-key");
    });

    it("throws when no results are found", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ZERO_RESULTS", results: [] }),
      });

      await expect(service.geocode({ address: "Nowhere" })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ label: "geocode" }),
        "google_maps_no_results",
      );
    });
  });

  describe("reverseGeocode", () => {
    it("returns an address for valid coordinates", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [
            {
              place_id: "ChIJ-reverse",
              formatted_address: "Pune, Maharashtra, India",
            },
          ],
        }),
      });

      const result = await service.reverseGeocode({
        latitude: 18.5204,
        longitude: 73.8567,
      });

      expect(result).toEqual({
        placeId: "ChIJ-reverse",
        formattedAddress: "Pune, Maharashtra, India",
      });
    });
  });

  describe("searchPlaces", () => {
    it("returns hospital places within radius", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              id: "ChIJ-place-1",
              displayName: { text: "City Hospital" },
              formattedAddress: "123 Main St, Pune",
              location: { latitude: 18.52, longitude: 73.86 },
              rating: 4.5,
              types: ["hospital", "health"],
            },
          ],
        }),
      });

      const result = await service.searchPlaces({
        query: "hospital",
        latitude: 18.5204,
        longitude: 73.8567,
        radiusKm: 10,
        type: "hospital",
      });

      expect(result.places).toHaveLength(1);
      expect(result.places[0]).toMatchObject({
        placeId: "ChIJ-place-1",
        name: "City Hospital",
        latitude: 18.52,
        longitude: 73.86,
        rating: 4.5,
        types: ["hospital", "health"],
      });
      // Verify the request uses the Places API (New) endpoint with the key in headers.
      const init = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as
        | RequestInit
        | undefined;
      expect(init?.method).toBe("POST");
      expect(init?.headers).toMatchObject({
        "X-Goog-Api-Key": "test-server-key",
      });
    });

    it("omits includedTypes when type is not provided", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ places: [] }),
      });

      await service.searchPlaces({
        query: "pharmacy",
        latitude: 18.5204,
        longitude: 73.8567,
        radiusKm: 10,
      });

      const init = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[1] as
        | RequestInit
        | undefined;
      const body = JSON.parse((init?.body as string) ?? "{}");
      expect(body.includedTypes).toBeUndefined();
    });
  });

  describe("route", () => {
    it("returns distance and duration", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          routes: [
            {
              distanceMeters: 5432,
              duration: "300s",
            },
          ],
        }),
      });

      const result = await service.route({
        originLatitude: 18.5204,
        originLongitude: 73.8567,
        destinationLatitude: 18.5937,
        destinationLongitude: 73.7399,
      });

      expect(result).toEqual({
        distanceMeters: 5432,
        durationSeconds: 300,
      });
    });
  });

  describe("error handling", () => {
    it("throws on non-ok response", async () => {
      const service = createService();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: "internal error" } }),
      });

      await expect(service.geocode({ address: "x" })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });

    it("throws on fetch timeout", async () => {
      const service = createService();
      // Abort the fetch to simulate a timeout
      mockFetch.mockImplementation(() => {
        const err = new Error("The operation timed out") as Error & { name: string };
        err.name = "TimeoutError";
        return Promise.reject(err);
      });

      await expect(service.geocode({ address: "x" })).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
    });
  });
});
