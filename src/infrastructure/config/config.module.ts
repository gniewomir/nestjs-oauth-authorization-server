import { Module } from "@nestjs/common";
import { ConfigModule as NestConfigModule } from "@nestjs/config";
import { AppConfig, DatabaseConfig } from "./configs";
import { LoggerModule } from "../logger";
import { OrderingConfig } from "./configs/ordering.config";

@Module({
  imports: [LoggerModule, NestConfigModule.forRoot()],
  providers: [
    AppConfig.provider(),
    DatabaseConfig.provider(),
    OrderingConfig.provider(),
  ],
  exports: [AppConfig, DatabaseConfig],
})
export class ConfigModule {}
