import { Module } from "@nestjs/common";
import { ApiModule } from "@interface/api";
import { LoggerModule } from "@infrastructure/logger";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";

@Module({
  imports: [ApiModule, LoggerModule, ConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
