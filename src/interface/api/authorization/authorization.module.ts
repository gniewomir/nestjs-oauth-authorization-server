import { Module } from "@nestjs/common";

import { AuthorizationModule as ApplicationAuthorizationModule } from "@application/authorization";
import { TemplateModule } from "@infrastructure/template";

import { AuthorizationController } from "./authorization.controller";

@Module({
  imports: [ApplicationAuthorizationModule, TemplateModule],
  controllers: [AuthorizationController],
  providers: [],
})
export class AuthorizationModule {}
