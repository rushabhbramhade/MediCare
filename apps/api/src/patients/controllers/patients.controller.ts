import type { AuthUser, PatientProfile } from "@medicare/types";
import {
  patientProfilePatchSchema,
  patientProfilePutSchema,
  type PatientProfilePatchInput,
  type PatientProfilePutInput,
} from "@medicare/validators";
import { Body, Controller, Get, Inject, Patch, Put, Req } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ServiceAudited } from "../../common/decorators/service-audited.decorator";
import { ZodValidationPipe } from "../../common/pipes/zod-validation.pipe";
import type { AuthenticatedRequest } from "../../common/request.types";
import { PatientsService } from "../services/patients.service";

interface ProfileResponse {
  profile: PatientProfile;
}

@ApiTags("patients")
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: "Missing or invalid access token" })
@ApiForbiddenResponse({ description: "The verified role cannot access patient profiles" })
@Roles("patient")
@Controller("patients")
@ServiceAudited()
export class PatientsController {
  constructor(@Inject(PatientsService) private readonly patients: PatientsService) {}

  @Get("me")
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  @ApiOperation({ summary: "Read the authenticated patient's profile" })
  @ApiOkResponse({ description: "The profile linked to the verified identity" })
  @ApiNotFoundResponse({ description: "No profile exists yet (code: profile_not_found)" })
  async me(
    @CurrentUser() user: AuthUser,
    @Req() request: AuthenticatedRequest,
  ): Promise<ProfileResponse> {
    return { profile: await this.patients.getProfile(user, request.id) };
  }

  @Put("me")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Create or replace the authenticated patient's profile" })
  @ApiOkResponse({ description: "The created or replaced profile" })
  @ApiBadRequestResponse({ description: "Body failed validation" })
  async put(
    @CurrentUser() user: AuthUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(patientProfilePutSchema)) input: PatientProfilePutInput,
  ): Promise<ProfileResponse> {
    return { profile: await this.patients.putProfile(user, input, request.id) };
  }

  @Patch("me")
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: "Update selected fields on the authenticated patient's profile" })
  @ApiOkResponse({ description: "The updated profile" })
  @ApiBadRequestResponse({ description: "Body failed validation" })
  @ApiNotFoundResponse({ description: "No profile exists yet (code: profile_not_found)" })
  async patch(
    @CurrentUser() user: AuthUser,
    @Req() request: AuthenticatedRequest,
    @Body(new ZodValidationPipe(patientProfilePatchSchema)) input: PatientProfilePatchInput,
  ): Promise<ProfileResponse> {
    return { profile: await this.patients.patchProfile(user, input, request.id) };
  }
}
