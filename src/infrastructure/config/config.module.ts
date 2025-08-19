import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { LoggerModule } from "../logger";

import { ConfigService } from "./config.service";
import {
  AppConfig,
  AuthConfig,
  DatabaseConfig,
  OpenApiConfig,
} from "./configs";

@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    ConfigService,
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
    OpenApiConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OpenApiConfig],
})
export class ConfigModule {}
