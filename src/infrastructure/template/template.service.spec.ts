import * as path from "node:path";

import { Test, TestingModule } from "@nestjs/testing";
import { v4 } from "uuid";

import { TemplateService } from "./template.service";

describe("TemplateService", () => {
  let service: TemplateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TemplateService],
    }).compile();

    service = module.get<TemplateService>(TemplateService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should render prompt template with data", async () => {
    const id = v4();
    const result = await service.renderTemplate(
      path.join(__dirname, "template.service.spec.html"),
      { id },
    );

    expect(result).toContain(id);
  });

  it("should handle template caching", async () => {
    const id = v4();
    const rendered = await service.renderTemplate(
      path.join(__dirname, "template.service.spec.html"),
      { id },
    );
    const cached = await service.renderTemplate(
      path.join(__dirname, "template.service.spec.html"),
      { id },
    );
    expect(rendered).toBe(cached);
  });
});
