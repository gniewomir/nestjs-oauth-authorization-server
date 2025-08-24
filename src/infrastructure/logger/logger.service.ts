import { Injectable, Scope } from "@nestjs/common";
import * as winston from "winston";

import { AppConfig } from "@infrastructure/config/configs";

import { LoggerInfoObject, LoggerInterface } from "./logger.interface";

@Injectable({ scope: Scope.TRANSIENT }) // ensure every consumer gets fresh instance
export class LoggerService implements LoggerInterface {
  private readonly logger: winston.Logger;
  private context: string;

  constructor(appConfig: AppConfig) {
    this.logger = winston.createLogger({
      level: appConfig.logLevel,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: "api" },
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize({
              colors: {
                debug: "white",
                verbose: "blue",
                info: "green",
                warn: "yellow",
                error: "red",
              },
            }),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  debug(message: string | LoggerInfoObject, ...meta: unknown[]): void {
    this.logger.debug(
      typeof message === "string"
        ? {
            message,
            context: this.context,
            meta,
          }
        : {
            ...message,
            context: this.context,
            meta,
          },
    );
  }

  verbose(message: string | LoggerInfoObject, ...meta: unknown[]): void {
    this.logger.verbose(
      typeof message === "string"
        ? {
            message,
            context: this.context,
            meta,
          }
        : {
            ...message,
            context: this.context,
            meta,
          },
    );
  }

  info(message: string | LoggerInfoObject, ...meta: unknown[]): void {
    this.logger.info(
      typeof message === "string"
        ? {
            message,
            context: this.context,
            meta,
          }
        : {
            ...message,
            context: this.context,
            meta,
          },
    );
  }

  log(message: string | LoggerInfoObject, ...meta: unknown[]): void {
    this.logger.info(
      typeof message === "string"
        ? {
            message,
            context: this.context,
            meta,
          }
        : {
            ...message,
            context: this.context,
            meta,
          },
    );
  }

  warn(message: string | LoggerInfoObject, ...meta: unknown[]): void {
    this.logger.warn(
      typeof message === "string"
        ? {
            message,
            context: this.context,
            meta,
          }
        : {
            ...message,
            context: this.context,
            meta,
          },
    );
  }

  error(message: string | LoggerInfoObject, ...meta: unknown[]): void {
    this.logger.error(
      typeof message === "string"
        ? {
            message,
            context: this.context,
            meta,
          }
        : {
            ...message,
            context: this.context,
            meta,
          },
    );
  }

  setContext(context: string): void {
    this.context = context;
  }
}
