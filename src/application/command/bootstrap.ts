import {
  DynamicModule,
  ForwardReference,
  INestApplicationContext,
  Type,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppConfig } from "@infrastructure/config/configs";
import {
  LoggerInterface,
  LoggerInterfaceSymbol,
  LoggerService,
} from "@infrastructure/logger";

type TCommandPayload = (context: {
  application: INestApplicationContext;
  logger: LoggerInterface;
  appConfig: AppConfig;
}) => Promise<void>;

export async function commandBootstrap({
  baseModule,
  name,
  payload,
}: {
  name: string;
  baseModule: Type<any> | DynamicModule | ForwardReference;
  payload: TCommandPayload;
}) {
  const application = await NestFactory.createApplicationContext(baseModule, {
    bufferLogs: true, // store logs until custom logger is available
  });
  const logger = await application.resolve<
    typeof LoggerInterfaceSymbol,
    LoggerService
  >(LoggerInterfaceSymbol);
  logger.setContext(name);
  application.useLogger(logger);

  const appConfig = await application.resolve<AppConfig>(AppConfig);

  logger.log(`Environment => ${appConfig.env}`);

  await payload({ application, logger, appConfig });

  await application.close();
}
