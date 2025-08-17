import { Module } from "@nestjs/common";

import { AuthorizationModule as ApplicationAuthorizationModule } from "@application/authorization";
import { ConfigModule } from "@infrastructure/config";
import { LoggerModule } from "@infrastructure/logger";
import { TemplateModule } from "@infrastructure/template";

import { AuthorizationController } from "./authorization.controller";

@Module({
  imports: [
    ConfigModule,
    ApplicationAuthorizationModule,
    TemplateModule,
    LoggerModule,
  ],
  controllers: [AuthorizationController],
  providers: [],
})
export class AuthorizationModule {}
