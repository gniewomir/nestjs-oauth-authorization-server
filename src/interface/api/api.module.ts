import { Module } from "@nestjs/common";

import { DevApiModule } from "@interface/api/dev";
import { OauthApiModule } from "@interface/api/oauth/oauth-api.module";

import { StatusApiModule } from "./status";

@Module({
  imports: [DevApiModule, StatusApiModule, OauthApiModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
