import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { LoggerModule } from "@infrastructure/logger";
import { ApiModule } from "@interface/api";

@Module({
  imports: [ApiModule, LoggerModule, ConfigModule, DatabaseModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
