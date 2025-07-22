import { LoggerService } from "@nestjs/common";

export interface LoggerInterface extends LoggerService {
  setContext(context: string): void;
}

export const LoggerInterfaceSymbol = Symbol.for("LoggerInterface");
