import { Module } from "@nestjs/common";

import { AuthorizationModule as ApplicationAuthorizationModule } from "@application/authorization";

import { AuthorizationController } from "./authorization.controller";

@Module({
  imports: [ApplicationAuthorizationModule],
  controllers: [AuthorizationController],
})
export class AuthorizationModule {}
