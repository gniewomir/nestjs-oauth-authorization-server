import { Module } from "@nestjs/common";

import { OauthApiModule } from "@interface/api/oauth/oauth-api.module";

import { StatusApiModule } from "./status";

@Module({
  imports: [StatusApiModule, OauthApiModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
