import * as crypto from "node:crypto";

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";

import { LoggerInterface } from "./logger.interface";

export interface LoggingContext {
  correlationId: string;
  method: string;
  url: string;
  path: string;
  ip: string;
  userAgent: string;
  startTime: number;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerInterface) {
    this.logger.setContext("LoggingInterceptor");
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const correlationId = this.generateCorrelationId();
    const startTime = Date.now();

    const loggingContext: LoggingContext = {
      correlationId,
      method: request.method,
      url: request.url,
      path: request.url.split("?", 1)[0],
      ip: this.getClientIp(request),
      userAgent: request.get("User-Agent") || "Unknown",
      startTime,
    };

    // Add correlation ID to request for downstream use
    request.headers["x-correlation-id"] = correlationId;

    // Log incoming request
    this.logRequest(loggingContext);

    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        this.logResponse(loggingContext, response.statusCode, duration, data);
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logError(loggingContext, error, duration);
        throw error;
      }),
    );
  }

  private generateCorrelationId(): string {
    return crypto.randomUUID();
  }

  private getClientIp(request: Request): string {
    const forwardedFor = request.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor;

    return (
      request.ip || request.socket.remoteAddress || forwardedIp || "Unknown"
    );
  }

  private logRequest(context: LoggingContext): void {
    this.logger.info({
      message: `${context.method} ${context.path} (REQUEST)`,
      correlationId: context.correlationId,
      method: context.method,
      url: context.url,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date(context.startTime).toISOString(),
    });
  }

  private logResponse(
    context: LoggingContext,
    statusCode: number,
    duration: number,
    data?: unknown,
  ): void {
    const logLevel = statusCode >= 400 ? "warn" : "info";
    const responseSize =
      data !== undefined
        ? Buffer.byteLength(JSON.stringify(data), "utf8")
        : undefined;

    this.logger[logLevel]({
      message: `${context.method} ${context.path} (RESPONSE)`,
      correlationId: context.correlationId,
      method: context.method,
      url: context.url,
      statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      ...(data !== undefined && { responseSize }),
    });
  }

  private logError(
    context: LoggingContext,
    error: unknown,
    duration: number,
  ): void {
    const errorInfo =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : {
            name: "UnknownError",
            message: String(error),
            stack: undefined,
          };

    this.logger.error({
      message: `${context.method} ${context.path} (ERROR)`,
      correlationId: context.correlationId,
      method: context.method,
      url: context.url,
      error: errorInfo,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  }
}
