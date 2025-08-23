import { Module } from "@nestjs/common";

import { AuthorizationModule as ApplicationAuthorizationModule } from "@application/authorization";
import { ConfigModule } from "@infrastructure/config";
import { LoggerModule } from "@infrastructure/logger";
import { CsrfModule } from "@infrastructure/security/csrf";
import { TemplateModule } from "@infrastructure/template";

import { OauthController } from "./oauth.controller";

@Module({
  imports: [
    ConfigModule,
    ApplicationAuthorizationModule,
    TemplateModule,
    LoggerModule,
    CsrfModule,
  ],
  controllers: [OauthController],
  providers: [],
})
export class OauthApiModule {}
