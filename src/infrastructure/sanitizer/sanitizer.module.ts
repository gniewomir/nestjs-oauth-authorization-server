import { Module } from "@nestjs/common";

import { DescriptionInterfaceSymbol } from "@domain/tasks/Description.interface";

import { SanitizationService } from "./sanitization.service";

@Module({
  providers: [
    {
      provide: DescriptionInterfaceSymbol,
      useClass: SanitizationService,
    },
  ],
  exports: [DescriptionInterfaceSymbol],
})
export class SanitizerModule {}
