import {
  DynamicModule,
  ForwardReference,
  INestApplicationContext,
  Type,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { CliExceptionFilter } from "@application/app/cli-exception-filter";
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

type TCommandPayloadNoLog = (context: {
  application: INestApplicationContext;
  appConfig: AppConfig;
}) => Promise<void>;

export async function cliBootstrap({
  baseModule,
  name,
  payload,
}: {
  name: string;
  baseModule: Type<any> | DynamicModule | ForwardReference;
  payload: TCommandPayload;
}) {
  const command = await NestFactory.createApplicationContext(baseModule, {
    bufferLogs: true, // store logs until custom logger is available
  });
  const logger = await command.resolve<
    typeof LoggerInterfaceSymbol,
    LoggerService
  >(LoggerInterfaceSymbol);
  logger.setContext(name);
  command.useLogger(logger);

  const appConfig = await command.resolve<AppConfig>(AppConfig);

  logger.info(`Environment => ${appConfig.nodeEnv}`);

  try {
    await payload({ application: command, logger, appConfig });
  } catch (error) {
    new CliExceptionFilter().log(error);
  }

  await command.close();
}

export async function cliBootstrapNoLogging({
  baseModule,
  payload,
}: {
  name: string;
  baseModule: Type<any> | DynamicModule | ForwardReference;
  payload: TCommandPayloadNoLog;
}) {
  const command = await NestFactory.createApplicationContext(baseModule, {
    logger: false,
  });

  const appConfig = await command.resolve<AppConfig>(AppConfig);

  try {
    await payload({ application: command, appConfig });
  } catch (error) {
    new CliExceptionFilter().log(error);
  }

  await command.close();
}
