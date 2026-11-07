import {
  RESOURCE_TYPES,
  type AvailabilityStatus,
  type AvailabilityVerificationStatus,
  type HospitalAvailability,
  type HospitalDetail,
  type HospitalSearchQuery,
  type HospitalSearchResponse,
  type HospitalSummary,
  type HospitalType,
  type HospitalVerificationStatus,
  type ResourceType,
} from "@medicare/types";
import {
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import type { Logger } from "pino";
import { APP_LOGGER } from "../../common/logger";
import { DatabaseService } from "../../database/database.service";
import { HOSPITAL_PROVIDER } from "../providers/hospital-provider.factory";
import type { HospitalProvider, HospitalProviderDescriptor } from "../providers/hospital-provider";

interface HospitalRow {
  id: string;
  external_id: string;
  name: string;
  address_line: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country_code: string;
  latitude: number;
  longitude: number;
  distance_km: number | null;
  has_emergency: boolean | null;
  phone: string | null;
  hospital_type: HospitalType | null;
  specialties: string[];
  opening_hours: string | null;
  is_open_24x7: boolean | null;
  has_ambulance: boolean | null;
  verification_status: HospitalVerificationStatus;
  provider: string;
  last_synced_at: Date | string;
  last_verified_at: Date | string | null;
  is_active: boolean;
  availability: unknown;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function roundDistanceKm(value: number): number {
  return Math.round(value * 100) / 100;
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

function mapAvailabilityJson(value: unknown): HospitalAvailability[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    const resourceType = row.resource_type as ResourceType;
    if (!RESOURCE_TYPES.includes(resourceType)) return [];

    return [
      {
        id: String(row.id),
        hospitalId: String(row.hospital_id),
        resourceType,
        status: row.status as AvailabilityStatus,
        quantity: typeof row.quantity === "number" ? row.quantity : null,
        source: String(row.source ?? ""),
        reportedAt: toIso(row.reported_at as Date | string),
        verifiedAt: row.verified_at ? toIso(row.verified_at as Date | string) : null,
        verificationStatus: row.verification_status as AvailabilityVerificationStatus,
        createdAt: toIso(row.created_at as Date | string),
        updatedAt: toIso(row.updated_at as Date | string),
      },
    ];
  });
}

type HospitalBase = Omit<HospitalSummary, "distanceKm">;

function mapHospitalBase(
  row: HospitalRow,
  descriptor: HospitalProviderDescriptor,
  now: number,
): HospitalBase {
  return {
    id: row.id,
    name: row.name,
    addressLine: row.address_line,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    latitude: row.latitude,
    longitude: row.longitude,
    hasEmergency: row.has_emergency,
    phone: row.phone,
    hospitalType: row.hospital_type,
    specialties: row.specialties,
    verificationStatus: row.verification_status,
    source: row.provider,
    lastSyncedAt: toIso(row.last_synced_at),
    isStale: isStale(row, descriptor.sync.maxStalenessHours, now),
    openingHours: row.opening_hours,
    isOpen24x7: row.is_open_24x7,
    hasAmbulance: row.has_ambulance,
    bedAvailability: "unknown",
    availability: mapAvailabilityJson(row.availability),
  };
}

export function mapHospitalRow(
  row: HospitalRow,
  descriptor: HospitalProviderDescriptor,
  now = Date.now(),
): HospitalSummary {
  return {
    ...mapHospitalBase(row, descriptor, now),
    distanceKm: roundDistanceKm(row.distance_km ?? 0),
  };
}

function mapHospitalDetail(
  row: HospitalRow,
  descriptor: HospitalProviderDescriptor,
  now = Date.now(),
): HospitalDetail {
  return {
    ...mapHospitalBase(row, descriptor, now),
    distanceKm: row.distance_km === null ? null : roundDistanceKm(row.distance_km),
    externalId: row.external_id,
    countryCode: row.country_code,
    lastVerifiedAt: row.last_verified_at ? toIso(row.last_verified_at) : null,
  };
}

const HOSPITAL_SELECT = `
  h.id, h.external_id, h.name, h.address_line, h.city, h.state, h.postal_code,
  h.country_code,
  ST_Y(h.location::geometry) AS latitude,
  ST_X(h.location::geometry) AS longitude,
  h.has_emergency, h.phone, h.hospital_type, h.specialties,
  h.opening_hours, h.is_open_24x7, h.has_ambulance,
  h.verification_status, h.provider, h.last_synced_at, h.last_verified_at,
  h.is_active,
  av.availability
`;

const AVAILABILITY_LATERAL = `
  LEFT JOIN LATERAL (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', a.id,
          'hospital_id', a.hospital_id,
          'resource_type', a.resource_type,
          'status', a.status::text,
          'quantity', a.quantity,
          'source', a.source,
          'reported_at', a.reported_at,
          'verified_at', a.verified_at,
          'verification_status', a.verification_status,
          'created_at', a.created_at,
          'updated_at', a.updated_at
        ) ORDER BY a.resource_type
      ),
      '[]'::json
    ) AS availability
    FROM app.hospital_availability a
    WHERE a.hospital_id = h.id
  ) av ON true
`;

function parseBbox(bbox: string): {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
} {
  const [minLng, minLat, maxLng, maxLat] = bbox.split(",").map(Number) as [
    number,
    number,
    number,
    number,
  ];
  return { minLng, minLat, maxLng, maxLat };
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

    const params: unknown[] = [];
    const add = (value: unknown): string => {
      params.push(value);
      return `$${params.length}`;
    };

    const longitudeParam = add(query.longitude);
    const latitudeParam = add(query.latitude);
    const origin = `ST_SetSRID(ST_MakePoint(${longitudeParam}, ${latitudeParam}), 4326)::geography`;

    const conditions = [
      "h.is_active = true",
      "h.verification_status IN ('verified', 'stale')",
    ];

    // A viewport filter replaces the radius so "search this area" is not
    // silently clipped by a 5 km circle.
    if (query.bbox) {
      const box = parseBbox(query.bbox);
      const envelope = `ST_MakeEnvelope(${add(box.minLng)}, ${add(box.minLat)}, ${add(box.maxLng)}, ${add(box.maxLat)}, 4326)::geography`;
      conditions.push(`ST_Intersects(h.location, ${envelope})`);
    } else {
      conditions.push(`ST_DWithin(h.location, ${origin}, ${add(radiusKm * 1_000)})`);
    }

    const text = query.q?.trim();
    if (text) {
      const like = add(`%${text}%`);
      conditions.push(
        `(h.name ILIKE ${like} OR h.address_line ILIKE ${like} OR h.city ILIKE ${like})`,
      );
    }

    const specialty = query.specialty?.trim();
    if (specialty) {
      const specialtyParam = add(specialty);
      conditions.push(
        `EXISTS (SELECT 1 FROM unnest(h.specialties) AS item WHERE lower(item) = lower(${specialtyParam}))`,
      );
    }

    if (query.emergencyOnly === true) conditions.push("h.has_emergency IS TRUE");
    if (query.hospitalType) conditions.push(`h.hospital_type = ${add(query.hospitalType)}`);
    if (query.open24x7 === true) conditions.push("h.is_open_24x7 IS TRUE");
    if (query.ambulanceAvailable === true) conditions.push("h.has_ambulance IS TRUE");

    const availabilityExists = (resourceType: ResourceType): string => {
      const resourceParam = add(resourceType);
      const freshness =
        descriptor.sync.maxStalenessHours === null
          ? ""
          : `AND a.reported_at > now() - (${add(descriptor.sync.maxStalenessHours)}::int * interval '1 hour')`;
      return `EXISTS (
        SELECT 1 FROM app.hospital_availability a
        WHERE a.hospital_id = h.id
          AND a.resource_type = ${resourceParam}
          AND a.status IN ('AVAILABLE', 'LIMITED')
          AND (a.quantity IS NULL OR a.quantity > 0)
          AND a.verification_status <> 'stale'
          ${freshness}
      )`;
    };

    if (query.availableBeds === true) conditions.push(availabilityExists("general_bed"));
    if (query.icuAvailable === true) conditions.push(availabilityExists("icu_bed"));

    const whereSql = conditions.join(" AND ");
    // Snapshot the WHERE parameters before adding LIMIT/OFFSET so the count
    // query binds exactly the parameters it references.
    const whereParams = [...params];
    const limitParam = add(pageSize);
    const offsetParam = add((page - 1) * pageSize);

    try {
      const [rowsResult, countResult] = await Promise.all([
        this.database.query<HospitalRow>(
          `
            SELECT ${HOSPITAL_SELECT},
              ST_Distance(h.location, ${origin}) / 1000.0 AS distance_km
            FROM app.hospitals h
            ${AVAILABILITY_LATERAL}
            WHERE ${whereSql}
            ORDER BY distance_km ASC, h.id ASC
            LIMIT ${limitParam} OFFSET ${offsetParam}
          `,
          params,
        ),
        this.database.query<{ total: string }>(
          `SELECT count(*)::text AS total FROM app.hospitals h WHERE ${whereSql}`,
          whereParams,
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

  /**
   * Complete public record for one hospital. There is no search origin here, so
   * `distanceKm` is null rather than an invented number.
   */
  async getById(id: string): Promise<HospitalDetail> {
    const descriptor = this.provider.describe();
    if (!descriptor.configured) {
      throw new ServiceUnavailableException({
        code: "no_data_source_configured",
        message: "No licensed hospital provider is configured",
      });
    }

    try {
      const result = await this.database.query<HospitalRow>(
        `
          SELECT ${HOSPITAL_SELECT}, NULL::double precision AS distance_km
          FROM app.hospitals h
          ${AVAILABILITY_LATERAL}
          WHERE h.id = $1
            AND h.is_active = true
            AND h.verification_status IN ('verified', 'stale')
          LIMIT 1
        `,
        [id],
      );

      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException({
          code: "hospital_not_found",
          message: "Hospital not found",
        });
      }

      return mapHospitalDetail(row, descriptor);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({ err: error, hospitalId: id }, "hospital_detail_failed");
      throw new ServiceUnavailableException({
        code: "hospital_detail_unavailable",
        message: "Hospital details are temporarily unavailable",
      });
    }
  }
}
