import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";

import {
  AuthenticationMiddleware,
  AuthenticationModule,
} from "@application/authentication";
import {
  AuthorizationMiddleware,
  AuthorizationModule,
} from "@application/authorization";
import { ConfigModule } from "@infrastructure/config";
import { DatabaseModule } from "@infrastructure/database";
import { LoggerModule } from "@infrastructure/logger";
import { ApiModule } from "@interface/api";

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    AuthenticationModule,
    AuthorizationModule,
    DatabaseModule,
    ApiModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes("*");
    consumer.apply(AuthorizationMiddleware).forRoutes("*");
  }
}
