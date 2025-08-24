import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";

import { LoggerInterfaceSymbol } from "./logger.interface";
import { LoggerService } from "./logger.service";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LoggerInterfaceSymbol,
      useClass: LoggerService,
    },
  ],
  exports: [LoggerInterfaceSymbol],
})
export class LoggerModule {}
