import { Module } from "@nestjs/common";

import { TemplateModule } from "@infrastructure/template";

import { DevController } from "./dev.controller";

@Module({
  imports: [TemplateModule],
  controllers: [DevController],
  providers: [],
})
export class DevApiModule {}
