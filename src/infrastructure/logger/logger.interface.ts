export interface LoggerInfoObject {
  message: string;
  context?: string;
  [key: string]: any;
}

export interface LoggerInterface {
  debug(message: string | LoggerInfoObject, ...meta: unknown[]): void;
  verbose(message: string | LoggerInfoObject, ...meta: unknown[]): void;
  info(message: string | LoggerInfoObject, ...meta: unknown[]): void;
  warn(message: string | LoggerInfoObject, ...meta: unknown[]): void;
  error(message: string | LoggerInfoObject, ...meta: unknown[]): void;
  setContext(context: string): void;
}

export const LoggerInterfaceSymbol = Symbol.for("LoggerInterface");
