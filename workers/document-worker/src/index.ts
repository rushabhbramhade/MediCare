import { QUEUES, loadWorkerEnv } from "@medicare/config";
import { UnrecoverableError, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const env = loadWorkerEnv(process.env);
const logger = pino({ level: env.LOG_LEVEL, base: { worker: "document" } });

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  QUEUES.documentProcessing,
  async (job) => {
    // No OCR adapter is implemented yet. Failing without retries is honest:
    // retrying cannot succeed until a provider is actually integrated.
    throw new UnrecoverableError(
      `Document processing is unavailable: no OCR provider adapter is configured (job ${job.id}).`,
    );
  },
  {
    connection,
    prefix: `${env.QUEUE_PREFIX}:bull`,
    concurrency: 2,
  },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "document job completed");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, err: error.message }, "document job failed");
});

worker.on("error", (error) => {
  logger.error({ err: error }, "document worker error");
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down document worker");
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

logger.info({ queue: QUEUES.documentProcessing }, "document worker started");
