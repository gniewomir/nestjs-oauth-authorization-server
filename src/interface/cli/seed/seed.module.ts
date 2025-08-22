import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { LoggerModule } from "@infrastructure/logger";
import {
  ClientDomainRepositoryModule,
  UserDomainRepositoryModule,
} from "@infrastructure/repositories/domain/authentication/OAuth";
import { PasswordModule } from "@infrastructure/security/password";

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    DatabaseModule,
    ClientDomainRepositoryModule,
    UserDomainRepositoryModule,
    PasswordModule,
  ],
  controllers: [],
  providers: [],
})
export class SeedModule {}
