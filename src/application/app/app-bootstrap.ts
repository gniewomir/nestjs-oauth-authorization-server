import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "@application/app";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";
import { AppConfig, OpenApiConfig } from "@infrastructure/config/configs";
import {
  ErrorResponseInterceptor,
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
      // What it does: Strips properties that don't have validation decorators
      // Practical impact: If someone sends { email: "test@test.com", extraField: "hack" } and your DTO only has @IsEmail() email,
      // the extraField gets removed
      whitelist: true,

      // What it does: Throws error if non-whitelisted properties are found - too strict
      forbidNonWhitelisted: false,

      // What it does: Throws error if unknown values are passed to known properties
      // Practical impact: If you have @IsIn(['a', 'b']) and someone sends 'c', it fails
      forbidUnknownValues: true,

      // What it does: Automatically transforms incoming data to match DTO types
      // Practical impact:
      // String "123" becomes number 123 if property is typed as number
      // "true" becomes true for boolean properties
      // Transforms query parameters from strings to proper types
      transform: true,

      // What it does: Skips validation for properties not present in the request
      // Practical impact: If your DTO has @IsEmail() email but request doesn't include email field, validation passes
      skipMissingProperties: true,

      // What it does: Skips validation for properties with null values
      // Practical impact: { email: null } would pass validation even if @IsEmail() is present
      skipNullProperties: false,

      // What it does: Skips validation for properties with undefined values
      // Practical impact: { email: undefined } would pass validation
      skipUndefinedProperties: true,

      // What it does: Disables detailed error messages in responses
      // Practical impact: Instead of "email must be an email", you get generic validation error
      disableErrorMessages: appConfig.nodeEnv === "production",

      // What it does: Uses custom error messages from decorators instead of default ones
      // Practical impact: If you have @IsEmail({ message: "Invalid email format" }), it uses your message
      dismissDefaultMessages: appConfig.nodeEnv === "production",

      // What it does: Includes additional debug information in error responses
      // Practical impact: Shows which validation failed, what value was received, etc.
      enableDebugMessages: appConfig.nodeEnv !== "production",
    }),
  );

  /**
   * Register global logging interceptor for HTTP request/response logging
   */
  const loggingInterceptorLogger = await app.resolve<LoggerService>(
    LoggerInterfaceSymbol,
  );
  const loggingInterceptor = new LoggingInterceptor(loggingInterceptorLogger);
  app.useGlobalInterceptors(loggingInterceptor);

  /**
   * Register global error response interceptor,
   * Intention is to make error responses uniform
   */
  const errorResponseInterceptor = await app.resolve<ErrorResponseInterceptor>(
    ErrorResponseInterceptor,
  );
  app.useGlobalInterceptors(errorResponseInterceptor);

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
