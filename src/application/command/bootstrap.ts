import {
  DynamicModule,
  ForwardReference,
  INestApplicationContext,
  Type,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import {
  LoggerInterface,
  LoggerInterfaceSymbol,
  LoggerService,
} from "@infrastructure/logger";

type TCommandPayload = ({
  context,
  logger,
}: {
  context: INestApplicationContext;
  logger: LoggerInterface;
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
  const context = await NestFactory.createApplicationContext(baseModule, {
    bufferLogs: true, // store logs until custom logger is available
  });
  const logger = await context.resolve<
    typeof LoggerInterfaceSymbol,
    LoggerService
  >(LoggerInterfaceSymbol);
  logger.setContext(name);
  context.useLogger(logger);

  await payload({ context: context, logger });

  await context.close();
}
