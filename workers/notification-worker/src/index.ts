import { QUEUES, loadWorkerEnv } from "@medicare/config";
import { UnrecoverableError, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const env = loadWorkerEnv(process.env);
const logger = pino({ level: env.LOG_LEVEL, base: { worker: "notification" } });

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const worker = new Worker(
  QUEUES.notifications,
  async (job) => {
    // No SMS or email adapter is implemented. Dropping notifications silently
    // would be worse than failing the job, which stays visible in the queue.
    throw new UnrecoverableError(
      `Notification delivery is unavailable: no SMS or email provider adapter is configured (job ${job.id}).`,
    );
  },
  {
    connection,
    prefix: `${env.QUEUE_PREFIX}:bull`,
    concurrency: 5,
  },
);

worker.on("completed", (job) => {
  logger.info({ jobId: job.id }, "notification job completed");
});

worker.on("failed", (job, error) => {
  logger.error({ jobId: job?.id, err: error.message }, "notification job failed");
});

worker.on("error", (error) => {
  logger.error({ err: error }, "notification worker error");
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down notification worker");
  await worker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

logger.info({ queue: QUEUES.notifications }, "notification worker started");
