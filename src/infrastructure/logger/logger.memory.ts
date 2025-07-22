import { LoggerInterface } from "./logger.interface";
import { LogLevel } from "@nestjs/common";

export class LoggerMemory implements LoggerInterface {
  public archive: unknown[][] = [];
  public logLevels: LogLevel[] = [
    "verbose",
    "debug",
    "log",
    "warn",
    "error",
    "fatal",
  ];
  public context: string = "";

  hasCall(
    level: string,
    context: string,
    message: any,
    ...optionalParams: any[]
  ): boolean {
    const args = [level, context, message, ...optionalParams];
    for (const entry of this.archive) {
      if (
        args.length === entry.length &&
        args.every((value, index) => value === entry[index])
      ) {
        return true;
      }
    }
    return false;
  }

  hasStringMessage(message: any): boolean {
    for (const entry of this.archive) {
      if (message === entry[2]) {
        return true;
      }
    }
    return false;
  }

  hasStringMessageContaining(partial: string): boolean {
    for (const entry of this.archive) {
      if (typeof entry[2] !== "string") {
        continue;
      }
      const message = entry[2];
      if (message.includes(partial)) {
        return true;
      }
    }
    return false;
  }

  debug(message: any, ...optionalParams: any[]): any {
    this.archive.push(["debug", this.context, message, ...optionalParams]);
  }

  error(message: any, ...optionalParams: any[]): any {
    this.archive.push(["error", this.context, message, ...optionalParams]);
  }

  fatal(message: any, ...optionalParams: any[]): any {
    this.archive.push(["fatal", this.context, message, ...optionalParams]);
  }

  log(message: any, ...optionalParams: any[]): any {
    this.archive.push(["log", this.context, message, ...optionalParams]);
  }

  setContext(context: string): void {
    this.context = context;
  }

  setLogLevels(levels: LogLevel[]): any {
    this.logLevels = levels;
  }

  verbose(message: any, ...optionalParams: any[]): any {
    this.archive.push(["verbose", this.context, message, ...optionalParams]);
  }

  warn(message: any, ...optionalParams: any[]): any {
    this.archive.push(["warn", this.context, message, ...optionalParams]);
  }
}
