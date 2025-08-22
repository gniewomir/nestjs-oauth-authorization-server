import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "@application/app";
import { AppExceptionFilter } from "@application/app/app-exception-filter";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";
import { AppConfig, OpenApiConfig } from "@infrastructure/config/configs";
import { LoggerInterfaceSymbol, LoggerService } from "@infrastructure/logger";

export async function appBootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // store logs until custom logger is available
  });

  const logger = await app.resolve<typeof LoggerInterfaceSymbol, LoggerService>(
    LoggerInterfaceSymbol,
  );
  logger.setContext("bootstrap");
  app.useLogger(logger);

  app.useGlobalFilters(new AppExceptionFilter());

  const appConfig = app.get(AppConfig);
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
    SwaggerModule.setup(openApiConfig.path, app, document);
  }

  await app.listen(appConfig.port);

  return { app, logger, appConfig };
}
