import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { AuthConfig } from "@infrastructure/config/configs/auth.config";

import { LoggerModule } from "../logger";

import { AppConfig, DatabaseConfig, OpenApiConfig } from "./configs";

@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
    OpenApiConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OpenApiConfig],
})
export class ConfigModule {}
