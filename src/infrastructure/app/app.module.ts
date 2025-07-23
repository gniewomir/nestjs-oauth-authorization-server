import { Module } from "@nestjs/common";
import { ApiModule } from "../../interface/api";
import { LoggerModule } from "../logger";
import { AppConfigModule } from "../app-config";
import { DatabaseModule } from "../database";

@Module({
  imports: [ApiModule, LoggerModule, AppConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
