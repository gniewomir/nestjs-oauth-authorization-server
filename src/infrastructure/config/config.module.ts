import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { LoggerModule } from "../logger";

import { ConfigService } from "./config.service";
import {
  AppConfig,
  AuthConfig,
  DatabaseConfig,
  HtmlConfig,
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
    HtmlConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OpenApiConfig, HtmlConfig],
})
export class ConfigModule {}
