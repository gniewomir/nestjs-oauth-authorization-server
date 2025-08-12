import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfig, DatabaseConfig } from "./configs";
import { LoggerModule } from "../logger";
import { OrderingConfig } from "./configs/ordering.config";
import { AuthConfig } from "@infrastructure/config/configs/auth.config";

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
