import "reflect-metadata"; // as required by class-transformer

import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "@application/app";
import { AppConfig, OpenApiConfig } from "@infrastructure/config/configs";
import { LoggerInterfaceSymbol, LoggerService } from "@infrastructure/logger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // store logs until custom logger is available
  });

  const logger = await app.resolve<typeof LoggerInterfaceSymbol, LoggerService>(
    LoggerInterfaceSymbol,
  );
  logger.setContext("bootstrap");
  app.useLogger(logger);

  const openApiConfig = app.get(OpenApiConfig);

  if (openApiConfig.exposed) {
    const options = new DocumentBuilder()
      .setTitle("Core")
      .setVersion("v1")
      .addOAuth2({
        type: "oauth2",
        flows: {
          authorizationCode: {
            authorizationUrl: openApiConfig.authorizationUrl,
            tokenUrl: openApiConfig.tokenUrl,
            scopes: openApiConfig.scopes,
            refreshUrl: openApiConfig.tokenUrl,
          },
        },
      })
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup(openApiConfig.path, app, document);
  }

  const appConfig = app.get(AppConfig);
  await app.listen(appConfig.port);

  return app;
}

void bootstrap().then(async (app) => {
  const logger = await app.resolve<typeof LoggerInterfaceSymbol, LoggerService>(
    LoggerInterfaceSymbol,
  );
  logger.setContext("bootstrap");
  logger.log(`Server is running on ${await app.getUrl()}`);
});
