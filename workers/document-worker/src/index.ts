import { QUEUES, loadWorkerEnv } from "@medicare/config";
import { UnrecoverableError, Worker } from "bullmq";
import IORedis from "ioredis";
import pino from "pino";

const env = loadWorkerEnv(process.env);
const logger = pino({ level: env.LOG_LEVEL, base: { worker: "document" } });

const connection = new IORedis(env.REDIS_URL, { maxRetriesPerRequest: null });

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";
const INTERNAL_SERVICE_TOKEN = env.INTERNAL_SERVICE_TOKEN;
const OCR_TIMEOUT_SECONDS = Number(process.env.OCR_TIMEOUT_SECONDS ?? 120);

/**
 * Process a single OCR job by calling the AI service OCR endpoint.
 * The job payload contains: documentId, patientId, filePath, mimeType, languages.
 */
async function processOCRJob(job: {
  documentId: string;
  patientId: string;
  filePath: string;
  mimeType: string;
  languages?: string;
}): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OCR_TIMEOUT_SECONDS * 1000);

  try {
    const response = await fetch(`${AI_SERVICE_URL}/v1/ocr/process`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(INTERNAL_SERVICE_TOKEN
          ? { "x-internal-token": INTERNAL_SERVICE_TOKEN }
          : {}),
      },
      body: JSON.stringify({
        document_id: job.documentId,
        file_path: job.filePath,
        mime_type: job.mimeType,
        languages: job.languages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { detail?: string };
      throw new Error(
        `AI service OCR failed: ${response.status} ${body.detail ?? response.statusText}`
      );
    }

    const result = (await response.json()) as {
      status: string;
      page_count: number;
      confidence_summary: number | null;
      review_required: boolean;
    };
    logger.info(
      {
        jobId: job.documentId,
        status: result.status,
        pageCount: result.page_count,
        confidence: result.confidence_summary,
        reviewRequired: result.review_required,
      },
      "ocr job completed via AI service"
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      logger.warn({ jobId: job.documentId }, "ocr job timed out");
      throw new Error(`OCR job timed out after ${OCR_TIMEOUT_SECONDS}s`);
    }
    logger.error({ jobId: job.documentId, err: error }, "ocr job failed");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

const worker = new Worker(
  QUEUES.documentProcessing,
  async (job) => {
    const { documentId, patientId, filePath, mimeType, languages } = job.data as {
      documentId: string;
      patientId: string;
      filePath: string;
      mimeType: string;
      languages?: string;
    };

    if (!documentId || !patientId || !filePath || !mimeType) {
      throw new UnrecoverableError(
        `OCR job missing required fields (job ${job.id})`
      );
    }

    logger.info(
      { jobId: job.id, documentId, patientId },
      "processing OCR job"
    );

    await processOCRJob({ documentId, patientId, filePath, mimeType, languages });
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
  logger.error(
    { jobId: job?.id, err: error?.message },
    "document job failed"
  );
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

logger.info(
  { queue: QUEUES.documentProcessing, aiServiceUrl: AI_SERVICE_URL },
  "document worker started"
);
