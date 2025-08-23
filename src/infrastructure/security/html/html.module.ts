import { Module } from "@nestjs/common";

import { DescriptionInterfaceSymbol } from "@domain/tasks/Description.interface";

import { HtmlService } from "./html.service";

@Module({
  providers: [
    {
      provide: DescriptionInterfaceSymbol,
      useClass: HtmlService,
    },
  ],
  exports: [DescriptionInterfaceSymbol],
})
export class HtmlModule {}
