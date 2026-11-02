import { randomUUID } from "node:crypto";
import type { ApiEnv } from "@medicare/config";
import pino from "pino";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { AuditService } from "../../audit/audit.service";
import { DatabaseService } from "../../database/database.service";
import { DisabledHospitalProvider } from "../../hospitals/providers/disabled-hospital-provider";
import type {
  HospitalProvider,
  HospitalProviderDescriptor,
} from "../../hospitals/providers/hospital-provider";
import { HospitalsService } from "../../hospitals/services/hospitals.service";
import { PatientsService } from "../services/patients.service";

const databaseUrl = process.env.DATABASE_URL;
const integration = databaseUrl ? describe : describe.skip;

// These tests need a migrated PostgreSQL with PostGIS. They are skipped, not
// faked, when DATABASE_URL is absent. Audit rows are append-only and are left
// behind on purpose; profile/user/hospital fixtures are removed.
integration("Milestone 2 database integration", () => {
  const userA = randomUUID();
  const userB = randomUUID();
  const providerName = `integration-${randomUUID()}`;
  const logger = pino({ level: "silent" });
  let database: DatabaseService;
  let patients: PatientsService;

  const hospitalProvider: HospitalProvider = {
    describe(): HospitalProviderDescriptor {
      return {
        name: providerName,
        configured: true,
        capabilities: {
          search: true,
          specialtyFilter: true,
          emergencyFilter: true,
          liveBedAvailability: false,
        },
        provenance: { source: providerName, license: "integration-test" },
        sync: { strategy: "scheduled", maxStalenessHours: 24 },
      };
    },
  };

  beforeAll(() => {
    database = new DatabaseService(
      {
        DATABASE_URL: databaseUrl,
        DATABASE_POOL_MAX: 4,
      } as ApiEnv,
      logger,
    );
    patients = new PatientsService(database, new AuditService(logger, database));
  });

  afterAll(async () => {
    await database.query("DELETE FROM app.patient_profiles WHERE user_id = ANY($1::uuid[])", [
      [userA, userB],
    ]);
    await database.query("DELETE FROM app.users WHERE id = ANY($1::uuid[])", [[userA, userB]]);
    await database.query("DELETE FROM app.hospitals WHERE provider = $1", [providerName]);
    await database.onModuleDestroy();
  });

  it("creates, reads and audits a profile in PostgreSQL", async () => {
    const created = await patients.putProfile(
      { id: userA, role: "patient", phone: "+919876543210" },
      {
        fullName: "Integration Asha",
        dateOfBirth: "1990-04-12",
        gender: "female",
        preferredLanguage: "hi",
        accessibilityPreferences: ["large_text"],
      },
      "req-integration-1",
    );

    expect(created.fullName).toBe("Integration Asha");
    expect(created.phone).toBe("+919876543210");
    expect(created.preferredLanguage).toBe("hi");

    const read = await patients.getProfile({ id: userA, role: "patient" }, "req-integration-2");
    expect(read.id).toBe(created.id);

    const auditRows = await database.query<{ action: string; metadata: unknown }>(
      `SELECT action, metadata FROM app.audit_logs WHERE actor_id = $1 ORDER BY id ASC`,
      [userA],
    );
    const actions = auditRows.rows.map((row) => row.action);
    expect(actions).toContain("patient_profile.created");
    expect(actions).toContain("patient_profile.read");

    const serialisedMetadata = JSON.stringify(auditRows.rows.map((row) => row.metadata));
    expect(serialisedMetadata).not.toContain("Integration Asha");
    expect(serialisedMetadata).not.toContain("+919876543210");
  });

  it("keeps one profile row when the first save is repeated", async () => {
    const first = await patients.getProfile({ id: userA, role: "patient" });
    const second = await patients.putProfile(
      { id: userA, role: "patient", phone: "+919876543210" },
      { fullName: "Integration Asha Duplicate" },
    );

    expect(second.id).toBe(first.id);
    const rows = await database.query<{ count: string }>(
      "SELECT count(*) FROM app.patient_profiles WHERE user_id = $1",
      [userA],
    );
    expect(rows.rows[0]?.count).toBe("1");
  });

  it("isolates one patient from another", async () => {
    await expect(patients.getProfile({ id: userB, role: "patient" })).rejects.toMatchObject({
      response: { code: "profile_not_found" },
    });

    const profileB = await patients.putProfile(
      { id: userB, role: "patient", phone: "+919812345678" },
      { fullName: "Integration Ravi" },
    );
    expect(profileB.fullName).toBe("Integration Ravi");

    await patients.patchProfile(
      { id: userA, role: "patient" },
      { fullName: "Integration Asha R." },
    );

    const readA = await patients.getProfile({ id: userA, role: "patient" });
    const readB = await patients.getProfile({ id: userB, role: "patient" });
    expect(readA.fullName).toBe("Integration Asha R.");
    expect(readB.fullName).toBe("Integration Ravi");
  });

  it("refuses to update or delete audit history", async () => {
    const row = await database.query<{ id: string }>(
      `SELECT id FROM app.audit_logs WHERE actor_id = $1 ORDER BY id ASC LIMIT 1`,
      [userA],
    );
    const id = row.rows[0]?.id;
    expect(id).toBeDefined();

    await expect(
      database.query("UPDATE app.audit_logs SET action = 'tampered' WHERE id = $1", [id]),
    ).rejects.toThrow(/append-only/);
    await expect(database.query("DELETE FROM app.audit_logs WHERE id = $1", [id])).rejects.toThrow(
      /append-only/,
    );
  });

  it("orders PostGIS hospital results by distance and filters honestly", async () => {
    async function insertHospital(input: {
      externalId: string;
      name: string;
      latitude: number;
      longitude: number;
      emergency: boolean | null;
      specialties: string[];
      verification?: "verified" | "stale" | "unverified";
    }) {
      await database.query(
        `
          INSERT INTO app.hospitals (
            provider, external_id, name, address_line, city, state, postal_code,
            location, has_emergency, specialties, verification_status
          ) VALUES (
            $1, $2, $3, 'Test Road', 'Mumbai', 'Maharashtra', '400001',
            ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
            $6, $7, $8
          )
        `,
        [
          providerName,
          input.externalId,
          input.name,
          input.longitude,
          input.latitude,
          input.emergency,
          input.specialties,
          input.verification ?? "verified",
        ],
      );
    }

    await insertHospital({
      externalId: "near",
      name: "Near Verified Hospital",
      latitude: 19.076,
      longitude: 72.8777,
      emergency: true,
      specialties: ["cardiology"],
    });
    await insertHospital({
      externalId: "mid",
      name: "Mid Verified Hospital",
      latitude: 19.12,
      longitude: 72.88,
      emergency: null,
      specialties: ["orthopedics"],
    });
    await insertHospital({
      externalId: "far",
      name: "Far Verified Hospital",
      latitude: 19.5,
      longitude: 73.5,
      emergency: true,
      specialties: ["cardiology"],
    });
    await insertHospital({
      externalId: "unverified",
      name: "Unverified Hospital",
      latitude: 19.077,
      longitude: 72.878,
      emergency: true,
      specialties: ["cardiology"],
      verification: "unverified",
    });

    const hospitals = new HospitalsService(database, hospitalProvider, logger);
    const result = await hospitals.search({
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 10,
      pageSize: 10,
    });

    expect(result.status).toBe("OK");
    expect(result.meta.total).toBe(2);
    expect(result.data.map((hospital) => hospital.name)).toEqual([
      "Near Verified Hospital",
      "Mid Verified Hospital",
    ]);
    expect(result.data[0]?.distanceKm).toBeLessThan(result.data[1]?.distanceKm ?? 0);
    expect(result.data.every((hospital) => hospital.bedAvailability === "unknown")).toBe(true);

    const cardiology = await hospitals.search({
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 10,
      specialty: "cardiology",
      pageSize: 10,
    });
    expect(cardiology.data.map((hospital) => hospital.name)).toEqual(["Near Verified Hospital"]);

    const emergency = await hospitals.search({
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 10,
      emergencyOnly: true,
      pageSize: 10,
    });
    expect(emergency.data.map((hospital) => hospital.name)).toEqual(["Near Verified Hospital"]);

    const secondPage = await hospitals.search({
      latitude: 19.076,
      longitude: 72.8777,
      radiusKm: 10,
      page: 2,
      pageSize: 1,
    });
    expect(secondPage.data.map((hospital) => hospital.name)).toEqual(["Mid Verified Hospital"]);
  });

  it("returns NO_DATA_SOURCE_CONFIGURED without touching the database", async () => {
    const hospitals = new HospitalsService(
      database,
      new DisabledHospitalProvider("disabled", "integration"),
      logger,
    );
    const result = await hospitals.search({ latitude: 19.076, longitude: 72.8777 });
    expect(result.status).toBe("NO_DATA_SOURCE_CONFIGURED");
    expect(result.data).toEqual([]);
    expect(result.meta.source).toBeNull();
  });
});
