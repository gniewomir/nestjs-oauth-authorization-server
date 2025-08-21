import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";
import { DefaultLayoutService } from "@infrastructure/template/layouts/page-default/default-layout.service";
import { TemplateService } from "@infrastructure/template/template.service";
import { TemplateInterfaceSymbol } from "@interface/api/Template.interface";

@Module({
  imports: [ConfigModule],
  providers: [
    TemplateService,
    {
      provide: TemplateInterfaceSymbol,
      useClass: TemplateService,
    },
    DefaultLayoutService,
  ],
  exports: [TemplateInterfaceSymbol, DefaultLayoutService],
})
export class TemplateModule {}
