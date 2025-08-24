import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "@application/app";
import { AppExceptionFilter } from "@application/app/app-exception-filter";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";
import { AppConfig, OpenApiConfig } from "@infrastructure/config/configs";
import {
  LoggerInterfaceSymbol,
  LoggerService,
  LoggingInterceptor,
} from "@infrastructure/logger";

export async function appBootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // store logs until custom logger is available
  });

  /**
   * Logger have to be configured by environment,
   * Therefore to avoid circular dependencies,
   * ConfigModule cannot depend on logger,
   * and should not, as errors during environment validation,
   * will prevent app from even starting
   */
  const appConfig = app.get(AppConfig);

  /**
   * Logger is configured to be transient - each dependent will receive new instance
   */
  const bootstrapLogger = await app.resolve<
    typeof LoggerInterfaceSymbol,
    LoggerService
  >(LoggerInterfaceSymbol);
  bootstrapLogger.setContext("bootstrap");
  app.useLogger(bootstrapLogger);

  /**
   * TODO: /oauth*path endpoints have tu serve responses compliant with OAuth2 standard,
   * in case of failing request DTO validation
   */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      skipMissingProperties: false,
      skipNullProperties: false,
      skipUndefinedProperties: false,
      forbidUnknownValues: true,
      disableErrorMessages: appConfig.nodeEnv === "production",
      dismissDefaultMessages: false,
      enableDebugMessages: appConfig.nodeEnv !== "production",
    }),
  );

  /**
   * Logger is configured to be transient - each dependent will receive new instance
   */
  const exceptionFilterLogger = await app.resolve<
    typeof LoggerInterfaceSymbol,
    LoggerService
  >(LoggerInterfaceSymbol);
  exceptionFilterLogger.setContext("AppExceptionFilter");
  app.useGlobalFilters(new AppExceptionFilter(exceptionFilterLogger));

  /**
   * Register global logging interceptor for HTTP request/response logging
   */
  const loggingInterceptorLogger = await app.resolve<
    typeof LoggerInterfaceSymbol,
    LoggerService
  >(LoggerInterfaceSymbol);
  const loggingInterceptor = new LoggingInterceptor(loggingInterceptorLogger);
  app.useGlobalInterceptors(loggingInterceptor);

  /**
   * OpenAPI have to provide authentication through all supported OAuth grants,
   * or other authentication methods
   */
  const openApiConfig = app.get(OpenApiConfig);
  if (openApiConfig.exposed) {
    const options = new DocumentBuilder()
      .setTitle("Core")
      .setVersion("v1")
      .addOAuth2({
        type: "oauth2",
        scheme: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: openApiConfig.authorizationUrl,
            tokenUrl: openApiConfig.tokenUrl,
            scopes: ScopeValueImmutableSet.fromString(openApiConfig.scopes)
              .describe()
              .reduce(
                (carry, { name, description }) => {
                  carry[name] = description;
                  return carry;
                },
                {} as Record<string, string>,
              ),
            refreshUrl: openApiConfig.tokenUrl,
          },
        },
      })
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(openApiConfig.path, app, document, {
      swaggerOptions: {
        initOAuth: {
          usePkceWithAuthorizationCodeGrant: true,
        },
      },
    });
  }

  await app.listen(appConfig.port);

  return { app, logger: bootstrapLogger, appConfig };
}
