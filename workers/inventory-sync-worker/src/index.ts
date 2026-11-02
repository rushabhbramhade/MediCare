import { QUEUES, loadWorkerEnv } from "@medicare/config";
import { UnrecoverableError, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const env = loadWorkerEnv(process.env);
const logger = pino({ level: env.LOG_LEVEL, base: { worker: "inventory-sync" } });

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  QUEUES.inventorySync,
  async (job) => {
    // No pharmacy provider contract exists. Never invent stock or prices.
    throw new UnrecoverableError(
      `Inventory sync is unavailable: no pharmacy provider adapter is configured (job ${job.id}).`,
    );
  },
  {
    connection,
    prefix: `${env.QUEUE_PREFIX}:bull`,
    concurrency: 1,
  },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "inventory sync job completed");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, err: error.message }, "inventory sync job failed");
});

worker.on("error", (error) => {
  logger.error({ err: error }, "inventory sync worker error");
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down inventory sync worker");
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

logger.info({ queue: QUEUES.inventorySync }, "inventory sync worker started");
