import { LoggerInterface } from "../../../logger";
import { validate } from "class-validator";
import * as assert from "node:assert";

export const configValidator: <T extends Record<keyof T, unknown>>(
  config: T,
  logger: LoggerInterface,
) => Promise<T> = async (config, logger) => {
  const errors = await validate(config);

  for (const error of errors) {
    logger.error(error.toString());
  }

  assert(errors.length === 0, "Errors during config validation");

  return config;
};
