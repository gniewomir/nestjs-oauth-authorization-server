import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import {
  AuthenticationMiddleware,
  AuthenticationModule,
} from "@application/authentication";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { LoggerModule } from "@infrastructure/logger";
import { ApiModule } from "@interface/api";

@Module({
  imports: [
    ApiModule,
    LoggerModule,
    ConfigModule,
    DatabaseModule,
    AuthenticationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes("*");
  }
}
