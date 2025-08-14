import { Module } from "@nestjs/common";

import { LoggerInterfaceSymbol } from "./logger.interface";
import { LoggerService } from "./logger.service";

@Module({
  providers: [
    {
      provide: LoggerInterfaceSymbol,
      useClass: LoggerService,
    },
  ],
  exports: [LoggerInterfaceSymbol],
})
export class LoggerModule {}
