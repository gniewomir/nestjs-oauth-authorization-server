import { Module } from "@nestjs/common";

import { AuthorizationModule } from "./authorization/authorization.module";
import { StatusModule } from "./status";

@Module({
  imports: [StatusModule, AuthorizationModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
