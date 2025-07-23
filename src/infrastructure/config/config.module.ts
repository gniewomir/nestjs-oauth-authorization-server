import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfig, DatabaseConfig } from "./configs";
import { LoggerModule } from "../logger";

@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [AppConfig.provider(), DatabaseConfig.provider()],
  exports: [],
})
export class ConfigModule {}
