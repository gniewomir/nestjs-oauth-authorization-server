import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Request } from "express";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";

import { OauthException } from "@domain/auth/OAuth/Errors/OauthException";
import { AppConfig } from "@infrastructure/config/configs";

export interface UniformErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    path: string;
    correlationId?: string;
  };
}

export interface OAuthErrorResponse {
  error: string;
  error_description: string;
  error_uri?: string;
  state?: string;
}

export const HTTP_STATUS_NAMES = new Map<number, string>([
  [100, "CONTINUE"],
  [101, "SWITCHING_PROTOCOLS"],
  [102, "PROCESSING"],
  [103, "EARLYHINTS"],
  [200, "OK"],
  [201, "CREATED"],
  [202, "ACCEPTED"],
  [203, "NON_AUTHORITATIVE_INFORMATION"],
  [204, "NO_CONTENT"],
  [205, "RESET_CONTENT"],
  [206, "PARTIAL_CONTENT"],
  [207, "MULTI_STATUS"],
  [208, "ALREADY_REPORTED"],
  [210, "CONTENT_DIFFERENT"],
  [300, "AMBIGUOUS"],
  [301, "MOVED_PERMANENTLY"],
  [302, "FOUND"],
  [303, "SEE_OTHER"],
  [304, "NOT_MODIFIED"],
  [307, "TEMPORARY_REDIRECT"],
  [308, "PERMANENT_REDIRECT"],
  [400, "BAD_REQUEST"],
  [401, "UNAUTHORIZED"],
  [402, "PAYMENT_REQUIRED"],
  [403, "FORBIDDEN"],
  [404, "NOT_FOUND"],
  [405, "METHOD_NOT_ALLOWED"],
  [406, "NOT_ACCEPTABLE"],
  [407, "PROXY_AUTHENTICATION_REQUIRED"],
  [408, "REQUEST_TIMEOUT"],
  [409, "CONFLICT"],
  [410, "GONE"],
  [411, "LENGTH_REQUIRED"],
  [412, "PRECONDITION_FAILED"],
  [413, "PAYLOAD_TOO_LARGE"],
  [414, "URI_TOO_LONG"],
  [415, "UNSUPPORTED_MEDIA_TYPE"],
  [416, "REQUESTED_RANGE_NOT_SATISFIABLE"],
  [417, "EXPECTATION_FAILED"],
  [418, "I_AM_A_TEAPOT"],
  [421, "MISDIRECTED"],
  [422, "UNPROCESSABLE_ENTITY"],
  [423, "LOCKED"],
  [424, "FAILED_DEPENDENCY"],
  [428, "PRECONDITION_REQUIRED"],
  [429, "TOO_MANY_REQUESTS"],
  [456, "UNRECOVERABLE_ERROR"],
  [500, "INTERNAL_SERVER_ERROR"],
  [501, "NOT_IMPLEMENTED"],
  [502, "BAD_GATEWAY"],
  [503, "SERVICE_UNAVAILABLE"],
  [504, "GATEWAY_TIMEOUT"],
  [505, "HTTP_VERSION_NOT_SUPPORTED"],
  [507, "INSUFFICIENT_STORAGE"],
  [508, "LOOP_DETECTED"],
]);

@Injectable()
export class ErrorResponseInterceptor implements NestInterceptor {
  constructor(private readonly appConfig: AppConfig) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest<Request>();
        const correlationId = request.headers["x-correlation-id"] as
          | string
          | undefined;
        const path = request.url;

        // Handle OAuth exceptions
        if (error instanceof OauthException) {
          return throwError(() => this.transformOAuthException(error));
        }

        // Handle other exceptions with uniform format
        return throwError(() =>
          this.transformToUniformError(error, path, correlationId),
        );
      }),
    );
  }

  private transformOAuthException(error: OauthException): OAuthErrorResponse {
    const response: OAuthErrorResponse = {
      error: error.errorCode,
      error_description: error.errorDescription,
    };

    if (error.errorUri) {
      response.error_uri = error.errorUri;
    }

    if (error.state) {
      response.state = error.state;
    }

    return response;
  }

  private transformToUniformError(
    error: unknown,
    path: string,
    correlationId?: string,
  ): UniformErrorResponse {
    let statusCode: number;
    let message: string;

    if (error instanceof HttpException) {
      statusCode = error.getStatus();
      message = error.message;
    } else if (error instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = error.message;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = String(error);
    }

    return {
      error: {
        code: HTTP_STATUS_NAMES.get(statusCode) || "UNKNOWN_ERROR",
        message:
          this.appConfig.nodeEnv === "production" ? "[REDACTED]" : message,
        timestamp: new Date().toISOString(),
        path,
        ...(correlationId && { correlationId }),
      },
    };
  }
}
