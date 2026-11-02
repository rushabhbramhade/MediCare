import type {
  AccessibilityPreference,
  AuthUser,
  Gender,
  PatientProfile,
  PatientProfilePatchInput,
  PatientProfileWriteInput,
  SupportedLanguage,
} from "@medicare/types";
import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditService, type AuditQueryExecutor } from "../../audit/audit.service";
import { DatabaseService } from "../../database/database.service";

interface PatientProfileRow {
  id: string;
  full_name: string;
  date_of_birth: string | Date | null;
  gender: Gender | null;
  phone: string | null;
  preferred_language: SupportedLanguage;
  accessibility_preferences: AccessibilityPreference[];
  created_at: Date | string;
  updated_at: Date | string;
}

const PROFILE_COLUMNS = `
  id, full_name, date_of_birth, gender, phone, preferred_language,
  accessibility_preferences, created_at, updated_at
`;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function toDateOnly(value: Date | string | null): string | null {
  if (value === null) return null;
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function mapProfileRow(row: PatientProfileRow): PatientProfile {
  return {
    id: row.id,
    fullName: row.full_name,
    dateOfBirth: toDateOnly(row.date_of_birth),
    gender: row.gender,
    phone: row.phone,
    preferredLanguage: row.preferred_language,
    accessibilityPreferences: row.accessibility_preferences,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
  };
}

/**
 * Every query is scoped by `user_id` from the verified token. No method accepts
 * a user id from the request body.
 */
@Injectable()
export class PatientsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly audit: AuditService,
  ) {}

  async getProfile(actor: AuthUser, requestId?: string): Promise<PatientProfile> {
    const result = await this.database.query<PatientProfileRow>(
      `SELECT ${PROFILE_COLUMNS} FROM app.patient_profiles WHERE user_id = $1`,
      [actor.id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException({
        code: "profile_not_found",
        message: "No patient profile exists yet",
      });
    }

    const profile = mapProfileRow(row);
    await this.audit.record({
      action: "patient_profile.read",
      outcome: "success",
      resourceType: "patient_profile",
      resourceId: profile.id,
      requestId,
      actorId: actor.id,
      actorRole: actor.role,
      statusCode: 200,
      source: "api",
    });
    return profile;
  }

  async putProfile(
    actor: AuthUser,
    input: PatientProfileWriteInput,
    requestId?: string,
  ): Promise<PatientProfile> {
    return this.database.withTransaction(async (client) => {
      await this.upsertUser(client, actor);

      const result = await client.query<PatientProfileRow & { inserted: boolean }>(
        `
          INSERT INTO app.patient_profiles (
            user_id, full_name, date_of_birth, gender, phone,
            preferred_language, accessibility_preferences
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (user_id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            date_of_birth = EXCLUDED.date_of_birth,
            gender = EXCLUDED.gender,
            phone = COALESCE(EXCLUDED.phone, app.patient_profiles.phone),
            preferred_language = EXCLUDED.preferred_language,
            accessibility_preferences = EXCLUDED.accessibility_preferences,
            updated_at = now()
          RETURNING ${PROFILE_COLUMNS}, (xmax = 0) AS inserted
        `,
        [
          actor.id,
          input.fullName,
          input.dateOfBirth ?? null,
          input.gender ?? null,
          actor.phone ?? null,
          input.preferredLanguage ?? "en",
          input.accessibilityPreferences ?? [],
        ],
      );

      const row = result.rows[0];
      if (!row) throw new Error("Profile upsert returned no row");

      const profile = mapProfileRow(row);
      await this.audit.recordWithin(client, {
        action: row.inserted ? "patient_profile.created" : "patient_profile.updated",
        outcome: "success",
        resourceType: "patient_profile",
        resourceId: profile.id,
        requestId,
        actorId: actor.id,
        actorRole: actor.role,
        statusCode: 200,
        source: "api",
        metadata: { changedFields: Object.keys(input) },
      });
      return profile;
    });
  }

  async patchProfile(
    actor: AuthUser,
    input: PatientProfilePatchInput,
    requestId?: string,
  ): Promise<PatientProfile> {
    return this.database.withTransaction(async (client) => {
      const result = await client.query<PatientProfileRow>(
        `
          UPDATE app.patient_profiles SET
            full_name = CASE WHEN $2 THEN $3 ELSE full_name END,
            date_of_birth = CASE WHEN $4 THEN $5::date ELSE date_of_birth END,
            gender = CASE WHEN $6 THEN $7 ELSE gender END,
            preferred_language = CASE WHEN $8 THEN $9 ELSE preferred_language END,
            accessibility_preferences =
              CASE WHEN $10 THEN $11::text[] ELSE accessibility_preferences END,
            updated_at = now()
          WHERE user_id = $1
          RETURNING ${PROFILE_COLUMNS}
        `,
        [
          actor.id,
          input.fullName !== undefined,
          input.fullName ?? null,
          input.dateOfBirth !== undefined,
          input.dateOfBirth ?? null,
          input.gender !== undefined,
          input.gender ?? null,
          input.preferredLanguage !== undefined,
          input.preferredLanguage ?? null,
          input.accessibilityPreferences !== undefined,
          input.accessibilityPreferences ?? null,
        ],
      );

      const row = result.rows[0];
      if (!row) {
        throw new NotFoundException({
          code: "profile_not_found",
          message: "Create your profile before updating it",
        });
      }

      const profile = mapProfileRow(row);
      await this.audit.recordWithin(client, {
        action: "patient_profile.updated",
        outcome: "success",
        resourceType: "patient_profile",
        resourceId: profile.id,
        requestId,
        actorId: actor.id,
        actorRole: actor.role,
        statusCode: 200,
        source: "api",
        metadata: { changedFields: Object.keys(input) },
      });
      return profile;
    });
  }

  private async upsertUser(client: AuditQueryExecutor, actor: AuthUser): Promise<void> {
    await client.query(
      `
        INSERT INTO app.users (id, phone, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO UPDATE SET
          phone = COALESCE(EXCLUDED.phone, app.users.phone),
          role = EXCLUDED.role,
          updated_at = now()
      `,
      [actor.id, actor.phone ?? null, actor.role],
    );
  }
}
