import { Module } from "@nestjs/common";

import { ClockInterfaceSymbol } from "@domain/Clock.interface";

import { ClockService } from "./clock.service";

@Module({
  imports: [],
  providers: [
    {
      provide: ClockInterfaceSymbol,
      useClass: ClockService,
    },
  ],
  exports: [ClockInterfaceSymbol],
})
export class ClockModule {}
