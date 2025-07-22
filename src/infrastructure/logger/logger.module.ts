import { Module } from "@nestjs/common";
import { LoggerService } from "./logger.service";
import { LoggerInterfaceSymbol } from "./logger.interface";

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
