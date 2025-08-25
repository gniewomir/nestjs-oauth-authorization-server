import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";

import { ErrorResponseInterceptor } from "./error-response.interceptor";
import { LoggerInterfaceSymbol } from "./logger.interface";
import { LoggerService } from "./logger.service";

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: LoggerInterfaceSymbol,
      useClass: LoggerService,
    },
    ErrorResponseInterceptor,
  ],
  exports: [LoggerInterfaceSymbol, ErrorResponseInterceptor],
})
export class LoggerModule {}
