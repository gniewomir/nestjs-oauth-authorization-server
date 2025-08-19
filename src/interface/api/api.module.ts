import { Module } from "@nestjs/common";

import { AuthorizationApiModule } from "./authorization/authorization-api.module";
import { StatusApiModule } from "./status";

@Module({
  imports: [StatusApiModule, AuthorizationApiModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
