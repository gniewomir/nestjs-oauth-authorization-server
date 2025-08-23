import { Module } from "@nestjs/common";

import { ClockModule } from "@infrastructure/clock";

import { CsrfService } from "./csrf.service";

@Module({
  imports: [ClockModule],
  providers: [CsrfService],
  exports: [CsrfService],
})
export class CsrfModule {}
