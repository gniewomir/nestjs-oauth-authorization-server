import { HttpException, HttpStatus } from "@nestjs/common";

import { OauthException } from "@domain/authentication/OAuth/Errors/OauthException";
import { LoggerService } from "@infrastructure/logger";

export interface ErrorLog {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  requestId?: string;
}

export interface OauthErrorLog extends ErrorLog {
  error: string;
  error_description: string;
  error_uri?: string;
}

export class CliExceptionFilter {
  private readonly logger = new LoggerService();

  public log(exception: unknown): void {
    const { message, ...rest } = this.parse(exception);
    this.logger.error(message, rest);
  }

  private parse(exception: unknown): ErrorLog | OauthErrorLog {
    if (exception instanceof HttpException) {
      return {
        statusCode: exception.getStatus(),
        message: exception.message,
        error: exception.name,
        timestamp: new Date().toISOString(),
      } satisfies ErrorLog;
    }

    if (exception instanceof OauthException) {
      return {
        statusCode: exception.statusCode,
        message: exception.message,
        timestamp: new Date().toISOString(),
        error: exception.errorCode,
        error_description: exception.errorDescription,
        error_uri: exception.errorUri,
      } satisfies OauthErrorLog;
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: exception.name,
        timestamp: new Date().toISOString(),
      } satisfies ErrorLog;
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Internal server error",
      error: "Unknown",
      timestamp: new Date().toISOString(),
    } satisfies ErrorLog;
  }
}
