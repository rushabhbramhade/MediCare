import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { SupabaseAuthGuard } from "../../common/guards/supabase-auth.guard";
import { OCRService } from "../services/ocr.service";
import { z } from "zod";

const ocrProcessSchema = z
  .object({
    filePath: z.string().min(1, "File path is required"),
    mimeType: z
      .string()
      .min(1, "MIME type is required")
      .refine(
        (type) =>
          [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/webp",
            "image/heic",
          ].includes(type),
        "Unsupported MIME type"
      ),
    languages: z
      .string()
      .optional()
      .default("eng,hin,mar")
      .describe("Comma-separated Tesseract language codes"),
  })
  .strict();

type OCRProcessInput = z.infer<typeof ocrProcessSchema>;

@ApiTags("medical-records")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Missing or invalid access token" })
@UseGuards(SupabaseAuthGuard)
@Controller("medical-records")
export class OCRController {
  constructor(private readonly ocr: OCRService) {}

  @Post(":id/ocr")
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: "Trigger OCR text extraction for a medical document",
    description:
      "Calls the internal AI service to run local Tesseract OCR on the document. The document must belong to the authenticated patient.",
  })
  @ApiParam({ name: "id", required: true, description: "Document ID" })
  @ApiResponse({ status: 200, description: "OCR processing started" })
  @ApiResponse({ status: 403, description: "Not authorized for this document" })
  @ApiResponse({ status: 503, description: "OCR service unavailable" })
  async processOCR(
    @Param("id") documentId: string,
    @Body(new ZodValidationPipe(ocrProcessSchema)) body: OCRProcessInput,
  ) {
    // Ownership check: the patient ID comes from the verified JWT,
    // not from the request body. The OCR service validates ownership
    // when retrieving the document from private storage.
    return this.ocr.processOCR({
      documentId,
      filePath: body.filePath,
      mimeType: body.mimeType,
      languages: body.languages,
    });
  }

  @Get(":id/ocr")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Get OCR extraction results for a medical document",
    description:
      "Returns the extracted text and page-level metadata. Requires document ownership.",
  })
  @ApiParam({ name: "id", required: true, description: "Document ID" })
  @ApiResponse({ status: 200, description: "OCR results" })
  @ApiResponse({ status: 404, description: "Document or OCR results not found" })
  async getOCR(@Param("id") documentId: string) {
    // In the current implementation, OCR results are retrieved by job ID.
    // The document ID maps to the latest OCR job for that document.
    return this.ocr.getOCRStatus(documentId);
  }

  @Get(":id/ocr/status")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({
    summary: "Get OCR processing status for a medical document",
    description: "Returns PENDING, PROCESSING, COMPLETED, FAILED, or REVIEW_REQUIRED.",
  })
  @ApiParam({ name: "id", required: true, description: "Document ID" })
  @ApiResponse({ status: 200, description: "OCR status" })
  async getOCRStatus(@Param("id") documentId: string) {
    return this.ocr.getOCRStatus(documentId);
  }
}
