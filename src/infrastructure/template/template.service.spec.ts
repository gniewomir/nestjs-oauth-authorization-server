import * as path from "node:path";

import { Test, TestingModule } from "@nestjs/testing";
import { v4 } from "uuid";

import { ConfigModule } from "@infrastructure/config";
import { LoggerModule } from "@infrastructure/logger";

import { TemplateService } from "./template.service";

describe("TemplateService", () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, LoggerModule],
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should render prompt template with data", async () => {
    const id = v4();
    const result = await service.renderTemplate({
      path: path.join(__dirname, "template.service.spec.html"),
      data: { id },
    });

    expect(result).toContain(id);
  });

  it("should handle template caching", async () => {
    const id = v4();
    const rendered = await service.renderTemplate({
      path: path.join(__dirname, "template.service.spec.html"),
      data: { id },
    });
    const cached = await service.renderTemplate({
      path: path.join(__dirname, "template.service.spec.html"),
      data: { id },
    });
    expect(rendered).toBe(cached);
  });
});
