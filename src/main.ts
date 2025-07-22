import { NestFactory } from "@nestjs/core";
import { AppModule } from "./infrastructure/app/app.module";
import { LoggerInterfaceSymbol } from "./infrastructure/logger";

const port = process.env.PORT ?? 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // store logs until custom logger is available
  });
  const logger = await app.resolve(LoggerInterfaceSymbol);
  logger.setContext("bootstrap");
  app.useLogger(logger);
  await app.listen(port);
  return logger;
}

bootstrap().then((logger) => {
  logger.log(`Server is running on port ${port}`);
});
