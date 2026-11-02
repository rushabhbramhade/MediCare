import type { ApiEnv } from "@medicare/config";
import { Inject, Injectable, type OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";
import type { Logger } from "pino";
import { APP_ENV } from "../config/env";
import { APP_LOGGER } from "../common/logger";

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;

  constructor(@Inject(APP_ENV) env: ApiEnv, @Inject(APP_LOGGER) logger: Logger) {
    this.client = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2_000),
    });
    this.client.on("error", (error) => logger.warn({ err: error }, "redis_error"));
  }

  get connection(): Redis {
    return this.client;
  }

  async ping(): Promise<string> {
    try {
      if (this.client.status === "wait" || this.client.status === "end") {
        await this.client.connect();
      }
      return await this.client.ping();
    } catch (error) {
      // Stop ioredis's background retry loop after a failed readiness probe;
      // the next probe reconnects. Otherwise a down Redis logs forever.
      this.client.disconnect();
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client.status === "wait" || this.client.status === "end") {
      this.client.disconnect();
      return;
    }
    await this.client.quit().catch(() => this.client.disconnect());
  }
}
