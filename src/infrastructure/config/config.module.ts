import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";

import { AuthConfig } from "@infrastructure/config/configs/auth.config";

import { LoggerModule } from "../logger";

import { OrderingConfig } from "./configs/ordering.config";
import { AppConfig, DatabaseConfig } from "./configs";

@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    AppConfig.provider(),
    AuthConfig.provider(),
    DatabaseConfig.provider(),
    OrderingConfig.provider(),
  ],
  exports: [AppConfig, AuthConfig, DatabaseConfig, OrderingConfig],
})
export class ConfigModule {}
