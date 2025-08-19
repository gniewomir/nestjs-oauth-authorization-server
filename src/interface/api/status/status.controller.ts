import { Controller, Get } from "@nestjs/common";

@Controller("status")
export class StatusController {
  @Get()
  getStatus(): string {
    return "OK";
  }
}
