import { Module } from "@nestjs/common";

import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { LoggerModule } from "@infrastructure/logger";
import { ClientDomainRepositoryModule } from "@infrastructure/repositories/domain/authentication/OAuth/Client";

@Module({
  imports: [
    LoggerModule,
    ConfigModule,
    DatabaseModule,
    ClientDomainRepositoryModule,
  ],
  controllers: [],
  providers: [],
})
export class SeedModule {}
