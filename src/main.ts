import "reflect-metadata"; // as required by class-transformer

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./application/app";
import { LoggerInterfaceSymbol, LoggerService } from "./infrastructure/logger";
import { AppConfig } from "./infrastructure/app-config/configs";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // store logs until custom logger is available
  });

  const logger = await app.resolve<typeof LoggerInterfaceSymbol, LoggerService>(
    LoggerInterfaceSymbol,
  );
  logger.setContext("bootstrap");
  app.useLogger(logger);

  const appConfig = app.get(AppConfig);

  await app.listen(appConfig.port);
  return app;
}

void bootstrap().then(async (app) => {
  const logger = await app.resolve<typeof LoggerInterfaceSymbol, LoggerService>(
    LoggerInterfaceSymbol,
  );
  logger.setContext("bootstrap");

  const appConfig = app.get(AppConfig);
  logger.log(`Server is running on port ${appConfig.port}`);
});
