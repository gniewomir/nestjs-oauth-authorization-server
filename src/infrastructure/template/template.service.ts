import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as Handlebars from "handlebars";

import { HtmlConfig } from "@infrastructure/config/configs";
import { TemplateInterface } from "@interface/api/Template.interface";

@Injectable()
export class TemplateService implements TemplateInterface {
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  constructor(private readonly htmlConfig: HtmlConfig) {}

  async renderTemplate({
    path,
    data,
  }: {
    path: string;
    data: Record<string, unknown>;
  }): Promise<string> {
    const template = await this.getTemplate(path);
    return template(data);
  }

  private async getTemplate(
    templatePath: string,
  ): Promise<HandlebarsTemplateDelegate> {
    if (this.htmlConfig.templateCache && this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const templateContent = await fs.promises.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);
    this.templateCache.set(templatePath, template);
    return template;
  }
}
