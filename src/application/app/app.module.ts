import { Module } from "@nestjs/common";
import { ApiModule } from "../../interface/api";
import { LoggerModule } from "../../infrastructure/logger";
import { AppConfigModule } from "../../infrastructure/app-config";
import { DatabaseModule } from "../../infrastructure/database";

@Module({
  imports: [ApiModule, LoggerModule, AppConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
