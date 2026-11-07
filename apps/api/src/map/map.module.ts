import { Module } from "@nestjs/common";
import { AppConfigModule } from "../config/config.module";
import { LoggerModule } from "../common/logger.module";
import { GoogleMapsService } from "./services/google-maps.service";
import { MapController } from "./controllers/map.controller";

@Module({
  imports: [AppConfigModule, LoggerModule],
  providers: [GoogleMapsService],
  controllers: [MapController],
  exports: [GoogleMapsService],
})
export class MapModule {}
