import { Injectable } from "@nestjs/common";

import { DefaultLayoutBuilder } from "@infrastructure/template/layouts/page-default/default-layout.builder";
import { TemplateService } from "@infrastructure/template/template.service";

@Injectable()
export class DefaultLayoutService {
  constructor(private readonly templates: TemplateService) {}

  public createPageBuilder(): DefaultLayoutBuilder {
    return new DefaultLayoutBuilder();
  }

  public renderPageBuilder(builder: DefaultLayoutBuilder): Promise<string> {
    return this.templates.renderTemplate({
      path: builder.getTemplatePath(),
      data: builder.getData(),
    });
  }
}
