import { Module } from "@nestjs/common";
import { ClockService } from "./clock.service";

@Module({
  imports: [],
  providers: [ClockService],
  exports: [ClockService],
})
export class ClockModule {}
