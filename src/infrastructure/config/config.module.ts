import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { AuthConfig } from "@infrastructure/config/configs/auth.config";

import { LoggerModule } from "../logger";

import { AppConfig, DatabaseConfig } from "./configs";

@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig],
})
export class ConfigModule {}
