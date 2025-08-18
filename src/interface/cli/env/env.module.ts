import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";
import { LoggerModule } from "@infrastructure/logger";

@Module({
  imports: [LoggerModule, ConfigModule],
  controllers: [],
  providers: [],
})
export class EnvModule {}
