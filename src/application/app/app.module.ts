import * as path from "node:path";

import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ServeStaticModule } from "@nestjs/serve-static";

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
import { CsrfMiddleware, CsrfModule } from "@infrastructure/security/csrf";
import { ApiModule } from "@interface/api";

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    AuthenticationModule,
    AuthorizationModule,
    DatabaseModule,
    ApiModule,
    CsrfModule,
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), "static"),
      serveRoot: "/static",
    }),
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthenticationMiddleware).forRoutes("/api/*path");
    consumer.apply(AuthorizationMiddleware).forRoutes("/api/*path");
    consumer.apply(CsrfMiddleware).forRoutes("/oauth/prompt");
  }
}
