import { Controller, Get } from "@nestjs/common";

@Controller()
export class StatusController {
  @Get()
  getStatus(): string {
    return "OK";
  }
}
