import { Inject, Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

export interface OCRConfig {
  provider: string;
  aiServiceUrl: string | undefined;
  internalServiceToken: string | undefined;
  maxFileSizeMB: number;
  maxPages: number;
  timeoutSeconds: number;
}

export interface OCRProcessResponse {
  jobId: string;
  status: string;
  documentId: string;
  provider: string;
  message: string;
}

export interface OCRStatusResponse {
  jobId: string;
  status: string;
  documentId: string;
  provider: string | null;
  languages: string[];
  pageCount: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number | null;
    ocrMethod: string;
    isUncertain: boolean;
  }>;
  fullText: string | null;
  confidenceSummary: number | null;
  processingError: string | null;
  reviewRequired: boolean;
}

/**
 * Server-side OCR service for the NestJS API.
 *
 * Calls the internal AI (FastAPI) service's OCR endpoints using the
 * internal service token. The backend key never reaches the browser.
 */
@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);

  constructor(@Inject("OCR_CONFIG") private readonly config: OCRConfig) {}

  private get aiServiceUrl(): string {
    if (!this.config.aiServiceUrl) {
      throw new ServiceUnavailableException({
        code: "ai_service_not_configured",
        message: "AI service URL is not configured",
      });
    }
    return this.config.aiServiceUrl;
  }

  private get internalToken(): string {
    if (!this.config.internalServiceToken) {
      throw new ServiceUnavailableException({
        code: "internal_service_token_not_configured",
        message: "Internal service authentication is not configured",
      });
    }
    return this.config.internalServiceToken;
  }

  async processOCR(params: {
    documentId: string;
    filePath: string;
    mimeType: string;
    languages?: string;
  }): Promise<OCRProcessResponse> {
    if (this.config.provider !== "tesseract") {
      throw new ServiceUnavailableException({
        code: "ocr_not_configured",
        message: "OCR is not configured. Set OCR_PROVIDER=tesseract.",
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutSeconds * 1000
    );

    try {
      const response = await fetch(`${this.aiServiceUrl}/v1/ocr/process`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-internal-token": this.internalToken,
        },
        body: JSON.stringify({
          document_id: params.documentId,
          file_path: params.filePath,
          mime_type: params.mimeType,
          languages: params.languages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          detail?: string;
        };
        this.logger.warn(
          { status: response.status, detail: body.detail },
          "ai_service_ocr_failed"
        );
        throw new ServiceUnavailableException({
          code: "ai_service_ocr_failed",
          message: `AI service OCR failed: ${body.detail ?? response.statusText}`,
        });
      }

      return (await response.json()) as OCRProcessResponse;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableException({
          code: "ocr_timeout",
          message: `OCR request timed out after ${this.config.timeoutSeconds}s`,
        });
      }
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error({ err: error }, "ocr_process_failed");
      throw new ServiceUnavailableException({
        code: "ocr_process_failed",
        message: "OCR processing failed",
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  async getOCRStatus(jobId: string): Promise<OCRStatusResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      this.config.timeoutSeconds * 1000
    );

    try {
      const response = await fetch(
        `${this.aiServiceUrl}/v1/ocr/status/${jobId}`,
        {
          method: "GET",
          headers: {
            "x-internal-token": this.internalToken,
          },
          signal: controller.signal,
        }
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as {
          detail?: string;
        };
        if (response.status === 404) {
          throw new ServiceUnavailableException({
            code: "ocr_job_not_found",
            message: "OCR job not found",
          });
        }
        this.logger.warn(
          { status: response.status, detail: body.detail, jobId },
          "ai_service_ocr_status_failed"
        );
        throw new ServiceUnavailableException({
          code: "ai_service_ocr_status_failed",
          message: `AI service OCR status failed: ${body.detail ?? response.statusText}`,
        });
      }

      return (await response.json()) as OCRStatusResponse;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new ServiceUnavailableException({
          code: "ocr_timeout",
          message: `OCR status request timed out after ${this.config.timeoutSeconds}s`,
        });
      }
      if (error instanceof ServiceUnavailableException) throw error;
      this.logger.error({ err: error, jobId }, "ocr_status_failed");
      throw new ServiceUnavailableException({
        code: "ocr_status_failed",
        message: "OCR status check failed",
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}
