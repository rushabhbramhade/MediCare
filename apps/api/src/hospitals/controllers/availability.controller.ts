import { z } from "zod";
import type { HospitalAvailability, ResourceType } from "@medicare/types";
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { Roles } from "../../common/decorators/roles.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import { HospitalAvailabilityService } from "../services/hospital-availability.service";

const upsertAvailabilitySchema = z.object({
  status: z.enum(["AVAILABLE", "LIMITED", "FULL", "UNKNOWN", "STALE"]),
  quantity: z.number().int().min(0).optional().nullable(),
  source: z.string().min(1).max(128),
  verificationStatus: z.enum(["verified", "unverified", "stale"]).optional(),
});

type UpsertAvailabilityInput = z.infer<typeof upsertAvailabilitySchema> & {
  verificationStatus?: "verified" | "unverified" | "stale";
};

@ApiTags("hospital-availability")
@ApiBearerAuth()
@Controller("hospital-availability")
export class HospitalAvailabilityController {
  constructor(
    private readonly availability: HospitalAvailabilityService,
  ) {}

  @Get("hospital/:hospitalId")
  @ApiOperation({ summary: "Get availability for a hospital" })
  @ApiParam({ name: "hospitalId", type: String })
  @ApiOkResponse({ description: "Availability records for the hospital" })
  async getAvailability(
    @Param("hospitalId") hospitalId: string,
  ): Promise<{ availability: HospitalAvailability[] }> {
    const availability = await this.availability.getAvailability(hospitalId);
    return { availability };
  }

  @Post("hospital/:hospitalId/resource/:resourceType")
  @Roles("hospital_admin")
  @ApiOperation({ summary: "Upsert availability for a hospital resource" })
  @ApiParam({ name: "hospitalId", type: String })
  @ApiParam({ name: "resourceType", type: String })
  @ApiOkResponse({ description: "Created or updated availability record" })
  async upsertAvailability(
    @Param("hospitalId") hospitalId: string,
    @Param("resourceType") resourceType: string,
    @Body(new ZodValidationPipe(upsertAvailabilitySchema)) input: UpsertAvailabilityInput,
  ): Promise<{ availability: HospitalAvailability }> {
    const validResourceTypes: ResourceType[] = [
      "general_bed", "icu_bed", "oxygen", "ventilator", "ambulance",
    ];
    if (!validResourceTypes.includes(resourceType as ResourceType)) {
      throw new NotFoundException({
        code: "invalid_resource_type",
        message: `Invalid resource type: ${resourceType}`,
      });
    }

    const availability = await this.availability.upsertAvailability(
      hospitalId,
      resourceType as ResourceType,
      input,
    );
    return { availability };
  }
}
