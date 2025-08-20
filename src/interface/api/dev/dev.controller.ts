import { Controller, Get } from "@nestjs/common";

@Controller("dev")
export class DevController {
  @Get("ok")
  getStatus(): string {
    return "OK";
  }
}
