import { AppConfig } from "@infrastructure/config/configs";

export const exceptionAsJsonString = (
  exception: Error,
  appConfig: AppConfig,
) => {
  // @ts-expect-error format stack in more readable way, without overthinking it
  exception.stack = exception.stack
    ? exception.stack.split("\n").map((str) => str.trim())
    : exception.stack;
  return appConfig.nodeEnv === "development"
    ? JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2)
    : undefined;
};
