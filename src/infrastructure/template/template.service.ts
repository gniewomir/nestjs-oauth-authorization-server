import { Injectable } from "@nestjs/common";
import * as fs from "fs";
import * as Handlebars from "handlebars";

import { TemplateInterface } from "@interface/api/authorization/template/Template.interface";

export interface PromptTemplateData {
  requestId: string;
  clientName: string;
  redirectUri: string;
  requestedScopes: string;
  state: string;
  taskApi: boolean;
  adminApi: boolean;
  tokenAuthenticate: boolean;
  tokenRefresh: boolean;
  tokenRefreshLargeTtl: boolean;
}

@Injectable()
export class TemplateService implements TemplateInterface {
  async renderTemplate(
    path: string,
    data: Record<string, unknown>,
  ): Promise<string> {
    const template = await this.getTemplate(path);
    return template(data);
  }
  private readonly templateCache = new Map<
    string,
    HandlebarsTemplateDelegate
  >();

  private async getTemplate(
    templatePath: string,
  ): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templatePath)) {
      return this.templateCache.get(templatePath)!;
    }

    const templateContent = await fs.promises.readFile(templatePath, "utf-8");
    const template = Handlebars.compile(templateContent);
    this.templateCache.set(templatePath, template);
    return template;
  }
}
