import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

import { OauthException } from "@domain/auth/OAuth/Errors";
import { LoggerService } from "@infrastructure/logger";

export interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path?: string;
  requestId?: string;
}

export interface OauthErrorResponse {
  error: string;
  error_description: string;
  error_uri?: string;
}

export const formatException = (exception: unknown) => {
  if (
    exception instanceof Error &&
    ["development", "test"].includes(process.env.NODE_ENV as unknown as string)
  ) {
    if (typeof exception.stack === "string") {
      // @ts-expect-error type safety ends here
      exception.stack = exception.stack
        ? exception.stack.split("\n").map((str) => str.trim())
        : exception.stack;
    }
    return JSON.parse(
      JSON.stringify(exception, Object.getOwnPropertyNames(exception), 2),
    ) as unknown as Record<string, unknown>;
  }
  return exception;
};

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new LoggerService();

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const [statusCode, message, errorResponse] = this.response(
      exception,
      request,
    );

    this.logger.error({
      message,
      method: request.method,
      url: request.url,
      userAgent: request.get("User-Agent"),
      ip: request.ip,
      statusCode: statusCode,
      exception: formatException(exception),
      requestId: this.extractRequestId(request),
    });

    response.status(statusCode).json(errorResponse);
  }

  private response(
    exception: unknown,
    request: Request,
  ): [number, string, ErrorResponse] | [number, string, OauthErrorResponse] {
    if (exception instanceof HttpException) {
      return [
        exception.getStatus(),
        exception.message,
        {
          statusCode: exception.getStatus(),
          message: exception.message,
          error: exception.name,
          timestamp: new Date().toISOString(),
          requestId: this.extractRequestId(request),
        } satisfies ErrorResponse,
      ];
    }

    if (exception instanceof OauthException) {
      return [
        exception.statusCode,
        exception.message,
        {
          error: exception.errorCode,
          error_description: exception.errorDescription,
          error_uri: exception.errorUri,
        } satisfies OauthErrorResponse,
      ];
    }

    if (exception instanceof Error) {
      return [
        HttpStatus.INTERNAL_SERVER_ERROR,
        "Internal server error",
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: "Internal server error",
          error: exception.name,
          timestamp: new Date().toISOString(),
          requestId: this.extractRequestId(request),
        } satisfies ErrorResponse,
      ];
    }

    return [
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Internal server error",
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: "Internal server error",
        error: "Unknown",
        timestamp: new Date().toISOString(),
        requestId: this.extractRequestId(request),
      } satisfies ErrorResponse,
    ];
  }

  private extractRequestId(request: Request): string | undefined {
    return (
      (request.headers["x-request-id"] as string) ||
      (request.headers["x-correlation-id"] as string) ||
      undefined
    );
  }
}
