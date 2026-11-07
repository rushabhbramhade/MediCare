import {
  Controller,
  Get,
} from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { getEmergencyNumbers } from "./emergency-numbers";
import type { AmbulanceEmergencyResponse } from "./emergency-numbers";

/**
 * Public emergency numbers endpoint.
 * No authentication required — emergency numbers are public information.
 */
@ApiTags("ambulance")
@Controller("ambulance")
export class AmbulanceController {
  @Get("emergency-numbers")
  @Public()
  @ApiOperation({
    summary: "Get public emergency contact numbers",
    description:
      "Returns India's public emergency numbers (112 national, 108 state-specific ambulance). " +
      "These are public information, not a provider integration. Medicare does not dispatch " +
      "or track ambulances.",
  })
  @ApiOkResponse({ description: "Public emergency numbers" })
  async getEmergencyNumbers(): Promise<AmbulanceEmergencyResponse> {
    return getEmergencyNumbers();
  }
}
