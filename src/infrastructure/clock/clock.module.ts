import { Module } from "@nestjs/common";
import { ClockService } from "./clock.service";
import { ClockInterfaceSymbol } from "@domain/Clock.interface";

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
