import { Test, TestingModule } from "@nestjs/testing";

import { StatusController } from "./status.controller";

describe("StatusController", () => {
  let statusController: StatusController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [StatusController],
      providers: [],
    }).compile();

    statusController = app.get<StatusController>(StatusController);
  });

  it('should return "Hello World!"', () => {
    expect(statusController.getStatus()).toBe("OK");
  });
});
