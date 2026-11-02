import type {
  AvailabilityStatus,
  HospitalAvailability,
  ResourceType,
} from "@medicare/types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DatabaseService } from "../../database/database.service";

interface AvailabilityRow {
  id: string;
  hospital_id: string;
  resource_type: ResourceType;
  status: AvailabilityStatus;
  quantity: number | null;
  source: string;
  reported_at: Date | string;
  verified_at: Date | string | null;
  verification_status: "verified" | "unverified" | "stale";
  created_at: Date | string;
  updated_at: Date | string;
}

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapAvailabilityRow(row: AvailabilityRow): HospitalAvailability {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    resourceType: row.resource_type,
    status: row.status,
    quantity: row.quantity,
    source: row.source,
    reportedAt: toIso(row.reported_at),
    verifiedAt: row.verified_at ? toIso(row.verified_at) : null,
    verificationStatus: row.verification_status,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

/**
 * Reads and writes hospital resource availability. Availability is never
 * inferred: a missing row means UNKNOWN, and stale rows are clearly labelled.
 */
@Injectable()
export class HospitalAvailabilityService {
  constructor(private readonly database: DatabaseService) {}

  async getAvailability(hospitalId: string): Promise<HospitalAvailability[]> {
    const result = await this.database.query<AvailabilityRow>(
      `
        SELECT id, hospital_id, resource_type, status, quantity, source,
               reported_at, verified_at, verification_status, created_at, updated_at
        FROM app.hospital_availability
        WHERE hospital_id = $1
        ORDER BY resource_type ASC, reported_at DESC
      `,
      [hospitalId],
    );

    return result.rows.map(mapAvailabilityRow);
  }

  async upsertAvailability(
    hospitalId: string,
    resourceType: ResourceType,
    input: {
      status: AvailabilityStatus;
      quantity?: number | null;
      source: string;
      verificationStatus?: "verified" | "unverified" | "stale";
    },
  ): Promise<HospitalAvailability> {
    // Verify the hospital exists and is active
    const hospital = await this.database.query<{ id: string }>(
      `SELECT id FROM app.hospitals WHERE id = $1 AND is_active = true`,
      [hospitalId],
    );

    if (hospital.rows.length === 0) {
      throw new NotFoundException({
        code: "hospital_not_found",
        message: "Hospital not found or inactive",
      });
    }

    const result = await this.database.query<AvailabilityRow>(
      `
        INSERT INTO app.hospital_availability (
          hospital_id, resource_type, status, quantity, source,
          verification_status, reported_at
        ) VALUES ($1, $2, $3, $4, $5, $6, now())
        ON CONFLICT (hospital_id, resource_type) DO UPDATE SET
          status = EXCLUDED.status,
          quantity = COALESCE(EXCLUDED.quantity, app.hospital_availability.quantity),
          source = EXCLUDED.source,
          verification_status = EXCLUDED.verification_status,
          reported_at = now(),
          updated_at = now()
        RETURNING id, hospital_id, resource_type, status, quantity, source,
                  reported_at, verified_at, verification_status, created_at, updated_at
      `,
      [
        hospitalId,
        resourceType,
        input.status,
        input.quantity ?? null,
        input.source,
        input.verificationStatus ?? "unverified",
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new Error("Availability upsert returned no row");
    }

    return mapAvailabilityRow(row);
  }

  async markStale(hospitalId: string): Promise<void> {
    await this.database.query(
      `
        UPDATE app.hospital_availability
        SET status = 'STALE', verification_status = 'stale', updated_at = now()
        WHERE hospital_id = $1
          AND status <> 'STALE'
          AND reported_at < now() - interval '24 hours'
      `,
      [hospitalId],
    );
  }
}
