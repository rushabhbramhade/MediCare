import type { ApiEnv } from "@medicare/config";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import type { Logger } from "pino";
import { APP_ENV } from "../config/env";
import { APP_LOGGER } from "../common/logger";

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(@Inject(APP_ENV) env: ApiEnv, @Inject(APP_LOGGER) logger: Logger) {
    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: env.DATABASE_POOL_MAX,
      connectionTimeoutMillis: 3_000,
      idleTimeoutMillis: 30_000,
      application_name: "medicare-api",
    });
    this.pool.on("error", (error) => logger.error({ err: error }, "database_pool_error"));
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: readonly unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, [...values]);
  }

  async ping(): Promise<void> {
    await this.pool.query("select 1");
  }

  async withTransaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("begin");
      const result = await work(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
