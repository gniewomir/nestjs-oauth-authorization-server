import { LoggerInterface } from "./logger.interface";
import { LoggerMemory } from "./logger.memory";

const levels = ["verbose", "debug", "log", "warn", "error", "fatal"];

describe("LoggerMemory", () => {
  describe("stores log messages with all metadata", () => {
    levels.forEach((level) => {
      it(`stores ${level} messages with log level, optional arguments and context`, () => {
        const logger = new LoggerMemory();
        const logContext = "context";
        const logMethodArgs = ["test", "first-optional", "second-optional"];
        const archive = [[level, logContext, ...logMethodArgs]];
        logger.setContext(logContext);

        // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
        logger[level as keyof LoggerInterface](...logMethodArgs);

        expect(logger.archive).toEqual(archive);
      });
    });
  });
  describe("it provides a way to check for exact log method call", () => {
    levels.forEach((level) => {
      it(`it provides a way to check for exact log method "${level}" call`, () => {
        const logger = new LoggerMemory();
        const logContext = "context";
        const logMethodArgs = ["test", "first-optional", "second-optional"];
        logger.setContext(logContext);

        // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
        logger[level as keyof LoggerInterface](...logMethodArgs);

        // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
        expect(logger.hasCall(level, logContext, ...logMethodArgs)).toBe(true);
      });
    });
    levels.forEach((level) => {
      it(`it recognizes different object references when checking for exact log method "${level}" call`, () => {
        const logger = new LoggerMemory();
        const logContext = "context";
        const logMethodArgs = ["test", {}];
        const logMethodArgsWithObjectOfDifferentReference = ["test", {}];
        logger.setContext(logContext);

        // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
        logger[level as keyof LoggerInterface](...logMethodArgs);

        expect(
          logger.hasCall(
            level,
            logContext,
            // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
            ...logMethodArgsWithObjectOfDifferentReference,
          ),
        ).toBe(false);
      });
    });
  });

  describe("it provides a way to check if exact string message was logged", () => {
    levels.forEach((level) => {
      it(`it provides a way to check if string message was logged`, () => {
        const logger = new LoggerMemory();
        const logContext = "context";
        const logMessage = "example log message";
        const differentLogMessage = "different log message";
        const logMethodArgs = [logMessage, "first-optional", "second-optional"];
        logger.setContext(logContext);

        // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
        logger[level as keyof LoggerInterface](...logMethodArgs);

        expect(logger.hasStringMessage(logMessage)).toBe(true);
        expect(logger.hasStringMessage(differentLogMessage)).toBe(false);
      });
    });
  });

  describe("it provides a way to check if string message containing specified string was logged", () => {
    levels.forEach((level) => {
      it(`it provides a way to check if string message was logged`, () => {
        const logger = new LoggerMemory();
        const logContext = "context";
        const logMessage = "example log message";
        const logMethodArgs = [logMessage, "first-optional", "second-optional"];
        logger.setContext(logContext);

        // @ts-expect-error TS2556: A spread argument must either have a tuple type or be passed to a rest parameter.
        logger[level as keyof LoggerInterface](...logMethodArgs);

        expect(logger.hasStringMessageContaining("example")).toBe(true);
        expect(logger.hasStringMessageContaining("different")).toBe(false);
      });
    });
  });
});
