#!/usr/bin/env node
// Applies database/migrations/*.sql in filename order, once each.
// Every file runs in its own transaction; a changed file is rejected.
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const repoRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const migrationsDir = path.join(repoRoot, "database", "migrations");
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env or export it.");
  process.exit(1);
}

const files = (await readdir(migrationsDir)).filter((name) => name.endsWith(".sql")).sort();

if (files.length === 0) {
  console.error(`No .sql migrations found in ${migrationsDir}`);
  process.exit(1);
}

const client = new pg.Client({
  connectionString: databaseUrl,
  application_name: "medicare-migrate",
});

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      filename    text PRIMARY KEY,
      checksum    text NOT NULL,
      applied_at  timestamptz NOT NULL DEFAULT now(),
      duration_ms integer NOT NULL
    )
  `);

  // Serialise concurrent deploys.
  await client.query("SELECT pg_advisory_lock($1)", [4242041]);

  let applied = 0;
  for (const filename of files) {
    const sql = await readFile(path.join(migrationsDir, filename), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    const existing = await client.query(
      "SELECT checksum FROM public.schema_migrations WHERE filename = $1",
      [filename],
    );

    if (existing.rowCount === 1) {
      if (existing.rows[0].checksum !== checksum) {
        throw new Error(
          `${filename} was already applied with a different checksum. Add a new migration instead of editing it.`,
        );
      }
      console.log(`skip    ${filename}`);
      continue;
    }

    const startedAt = Date.now();
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO public.schema_migrations (filename, checksum, duration_ms) VALUES ($1, $2, $3)",
        [filename, checksum, Date.now() - startedAt],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw new Error(
        `${filename} failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    applied += 1;
    console.log(`applied ${filename}`);
  }

  console.log(
    `Done. ${applied} migration(s) applied, ${files.length - applied} already up to date.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
