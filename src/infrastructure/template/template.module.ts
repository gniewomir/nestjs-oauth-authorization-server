import { Module } from "@nestjs/common";

import { TemplateService } from "@infrastructure/template/template.service";
import { TemplateInterfaceSymbol } from "@interface/api/authorization/template/Template.interface";

@Module({
  providers: [
    {
      provide: TemplateInterfaceSymbol,
      useClass: TemplateService,
    },
  ],
  exports: [TemplateInterfaceSymbol],
})
export class TemplateModule {}
