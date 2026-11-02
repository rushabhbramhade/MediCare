import type {
  HospitalSearchQuery,
  HospitalSearchResponse,
  HospitalSummary,
  HospitalType,
  HospitalVerificationStatus,
} from "@medicare/types";
import { Inject, Injectable, ServiceUnavailableException } from "@nestjs/common";
import type { Logger } from "pino";
import { APP_LOGGER } from "../../common/logger";
import { DatabaseService } from "../../database/database.service";
import { HOSPITAL_PROVIDER } from "../providers/hospital-provider.factory";
import type { HospitalProvider, HospitalProviderDescriptor } from "../providers/hospital-provider";

interface HospitalRow {
  id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number;
  longitude: number;
  distance_km: number;
  has_emergency: boolean | null;
  phone: string | null;
  hospital_type: HospitalType | null;
  specialties: string[];
  verification_status: HospitalVerificationStatus;
  provider: string;
  last_synced_at: Date | string;
  is_active: boolean;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isStale(
  row: Pick<HospitalRow, "verification_status" | "last_synced_at">,
  maxStalenessHours: number | null,
  now: number,
): boolean {
  if (row.verification_status === "stale") return true;
  if (maxStalenessHours === null) return false;
  const syncedAt =
    row.last_synced_at instanceof Date
      ? row.last_synced_at.getTime()
      : new Date(row.last_synced_at).getTime();
  return now - syncedAt > maxStalenessHours * 3_600_000;
}

export function mapHospitalRow(
  row: HospitalRow,
  descriptor: HospitalProviderDescriptor,
  now = Date.now(),
): HospitalSummary {
  return {
    id: row.id,
    name: row.name,
    addressLine: row.address_line,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    distanceKm: Math.round(row.distance_km * 100) / 100,
    hasEmergency: row.has_emergency,
    phone: row.phone,
    hospitalType: row.hospital_type,
    specialties: row.specialties,
    verificationStatus: row.verification_status,
    source: row.provider,
    lastSyncedAt: toIso(row.last_synced_at),
    isStale: isStale(row, descriptor.sync.maxStalenessHours, now),
    bedAvailability: "unknown",
  };
}

@Injectable()
export class HospitalsService {
  constructor(
    private readonly database: DatabaseService,
    @Inject(HOSPITAL_PROVIDER) private readonly provider: HospitalProvider,
    @Inject(APP_LOGGER) private readonly logger: Logger,
  ) {}

  async search(query: HospitalSearchQuery): Promise<HospitalSearchResponse> {
    const descriptor = this.provider.describe();
    const radiusKm = query.radiusKm ?? 5;
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const baseMeta = {
      source: descriptor.provenance.source,
      liveAvailabilitySupported: descriptor.capabilities.liveBedAvailability,
      capabilities: {
        specialtyFilter: descriptor.capabilities.specialtyFilter,
        emergencyFilter: descriptor.capabilities.emergencyFilter,
        typeFilter: descriptor.capabilities.specialtyFilter,
      },
      radiusKm,
      page,
      pageSize,
      total: 0,
      generatedAt: new Date().toISOString(),
      maxStalenessHours: descriptor.sync.maxStalenessHours,
    };

    if (!descriptor.configured) {
      return { status: "NO_DATA_SOURCE_CONFIGURED", data: [], meta: baseMeta };
    }

    const specialty = query.specialty?.trim() || null;
    const emergencyOnly = query.emergencyOnly === true;
    const hospitalType = query.hospitalType ?? null;
    const radiusMeters = radiusKm * 1_000;
    const offset = (page - 1) * pageSize;

    const filterSql = `
      WHERE is_active = true
        AND verification_status IN ('verified', 'stale')
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
        AND (
          $4::text IS NULL
          OR EXISTS (
            SELECT 1 FROM unnest(specialties) AS item
            WHERE lower(item) = lower($4)
          )
        )
        AND ($5::boolean = false OR has_emergency IS TRUE)
        AND (
          $6::text IS NULL OR hospital_type = $6
        )
    `;

    try {
      const [rowsResult, countResult] = await Promise.all([
        this.database.query<HospitalRow>(
          `
            SELECT
              id, name, address_line, city, state, postal_code,
              ST_Y(location::geometry) AS latitude,
              ST_X(location::geometry) AS longitude,
              ST_Distance(
                location,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
              ) / 1000.0 AS distance_km,
              has_emergency, phone, hospital_type, specialties,
              verification_status, provider, last_synced_at, is_active
            FROM app.hospitals
            ${filterSql}
            ORDER BY distance_km ASC, id ASC
            LIMIT $7 OFFSET $8
          `,
          [
            query.longitude,
            query.latitude,
            radiusMeters,
            specialty,
            emergencyOnly,
            hospitalType,
            pageSize,
            offset,
          ],
        ),
        this.database.query<{ total: string }>(
          `SELECT count(*)::text AS total FROM app.hospitals ${filterSql}`,
          [query.longitude, query.latitude, radiusMeters, specialty, emergencyOnly, hospitalType],
        ),
      ]);

      const total = Number(countResult.rows[0]?.total ?? "0");
      return {
        status: "OK",
        data: rowsResult.rows.map((row) => mapHospitalRow(row, descriptor)),
        meta: { ...baseMeta, total },
      };
    } catch (error) {
      this.logger.error({ err: error }, "hospital_search_failed");
      throw new ServiceUnavailableException({
        code: "hospital_search_unavailable",
        message: "Hospital search is temporarily unavailable",
      });
    }
  }
}
