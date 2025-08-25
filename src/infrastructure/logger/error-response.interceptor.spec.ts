import {
  CallHandler,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { of, throwError } from "rxjs";

import { OauthException } from "@domain/auth/OAuth/Errors/OauthException";
import { AppConfig } from "@infrastructure/config/configs";

import {
  ErrorResponseInterceptor,
  OAuthErrorResponse,
  UniformErrorResponse,
} from "./error-response.interceptor";

describe("ErrorResponseInterceptor", () => {
  let interceptor: ErrorResponseInterceptor;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Record<string, unknown>;
  let mockAppConfig: jest.Mocked<AppConfig>;

  beforeEach(() => {
    mockRequest = {
      url: "/api/test",
      headers: {},
    } as Record<string, unknown>;

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;

    mockAppConfig = {
      nodeEnv: "development",
    } as jest.Mocked<AppConfig>;

    interceptor = new ErrorResponseInterceptor(mockAppConfig);
  });

  describe("intercept", () => {
    it("should pass through successful responses without modification", (done) => {
      const responseData = { message: "success" };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (data: unknown) => {
          expect(data).toEqual(responseData);
          done();
        },
      });
    });

    describe("OAuth exceptions", () => {
      it("should transform OAuth exception with all fields", (done) => {
        const oauthError = new (class extends OauthException {
          constructor() {
            super({
              errorCode: "invalid_request",
              errorDescription: "Invalid request parameters",
              errorUri: "https://example.com/errors/invalid_request",
              state: "test-state",
              statusCode: HttpStatus.BAD_REQUEST,
            });
          }
        })();

        mockCallHandler.handle.mockReturnValue(throwError(() => oauthError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: OAuthErrorResponse) => {
            expect(error).toEqual({
              error: "invalid_request",
              error_description: "Invalid request parameters",
              error_uri: "https://example.com/errors/invalid_request",
              state: "test-state",
            });
            done();
          },
        });
      });

      it("should transform OAuth exception without optional fields", (done) => {
        const oauthError = new (class extends OauthException {
          constructor() {
            super({
              errorCode: "invalid_client",
              errorDescription: "Invalid client credentials",
              statusCode: HttpStatus.UNAUTHORIZED,
            });
          }
        })();

        mockCallHandler.handle.mockReturnValue(throwError(() => oauthError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: OAuthErrorResponse) => {
            expect(error).toEqual({
              error: "invalid_client",
              error_description: "Invalid client credentials",
            });
            done();
          },
        });
      });
    });

    describe("HTTP exceptions", () => {
      it("should transform HttpException to uniform error format", (done) => {
        const httpError = new HttpException("Not found", HttpStatus.NOT_FOUND);
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: UniformErrorResponse) => {
            expect(error).toEqual({
              error: {
                code: "NOT_FOUND",
                message: "Not found",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            expect(new Date(error.error.timestamp)).toBeInstanceOf(Date);
            done();
          },
        });
      });

      it("should handle HttpException with unknown status code", (done) => {
        const httpError = new HttpException("Custom error", 499);
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: UniformErrorResponse) => {
            expect(error).toEqual({
              error: {
                code: "UNKNOWN_ERROR",
                message: "Custom error",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            done();
          },
        });
      });
    });

    describe("Regular errors", () => {
      it("should transform Error to uniform error format", (done) => {
        const regularError = new Error("Something went wrong");
        mockCallHandler.handle.mockReturnValue(throwError(() => regularError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: UniformErrorResponse) => {
            expect(error).toEqual({
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "Something went wrong",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            done();
          },
        });
      });
    });

    describe("Unknown errors", () => {
      it("should transform unknown error to uniform error format", (done) => {
        const unknownError = "String error";
        mockCallHandler.handle.mockReturnValue(throwError(() => unknownError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: UniformErrorResponse) => {
            expect(error).toEqual({
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "String error",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            done();
          },
        });
      });

      it("should handle null error", (done) => {
        const nullError = null;
        mockCallHandler.handle.mockReturnValue(throwError(() => nullError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: UniformErrorResponse) => {
            expect(error).toEqual({
              error: {
                code: "INTERNAL_SERVER_ERROR",
                message: "null",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            done();
          },
        });
      });
    });

    describe("Correlation ID handling", () => {
      it("should include correlation ID when present in headers", (done) => {
        const httpError = new HttpException("Not found", HttpStatus.NOT_FOUND);
        mockRequest.headers = {
          "x-correlation-id": "test-correlation-id",
        };
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error) => {
            expect(error).toEqual({
              error: {
                code: "NOT_FOUND",
                message: "Not found",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
                correlationId: "test-correlation-id",
              },
            });
            done();
          },
        });
      });

      it("should not include correlation ID when not present in headers", (done) => {
        const httpError = new HttpException("Not found", HttpStatus.NOT_FOUND);
        mockRequest.headers = {};
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(error.error).not.toHaveProperty("correlationId");
            expect(error).toEqual({
              error: {
                code: "NOT_FOUND",
                message: "Not found",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            done();
          },
        });
      });

      it("should handle undefined correlation ID", (done) => {
        const httpError = new HttpException("Not found", HttpStatus.NOT_FOUND);
        mockRequest.headers = {
          "x-correlation-id": undefined,
        };
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            expect(error.error).not.toHaveProperty("correlationId");
            expect(error).toEqual({
              error: {
                code: "NOT_FOUND",
                message: "Not found",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/test",
              },
            });
            done();
          },
        });
      });
    });

    describe("Path handling", () => {
      it("should include correct path from request", (done) => {
        const httpError = new HttpException("Not found", HttpStatus.NOT_FOUND);
        mockRequest.url = "/api/users/123";
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error) => {
            expect(error).toEqual({
              error: {
                code: "NOT_FOUND",
                message: "Not found",
                timestamp: expect.any(String) as unknown as string,
                path: "/api/users/123",
              },
            });
            done();
          },
        });
      });
    });

    describe("Timestamp handling", () => {
      it("should generate valid ISO timestamp", (done) => {
        const httpError = new HttpException("Not found", HttpStatus.NOT_FOUND);
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          error: (error: UniformErrorResponse) => {
            const timestamp = error.error.timestamp;
            expect(timestamp).toMatch(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            );
            expect(new Date(timestamp).toISOString()).toBe(timestamp);
            done();
          },
        });
      });
    });

    describe("Environment-specific behavior", () => {
      it("should redact error messages in production environment", (done) => {
        const productionAppConfig = {
          nodeEnv: "production",
        } as jest.Mocked<AppConfig>;

        const productionInterceptor = new ErrorResponseInterceptor(
          productionAppConfig,
        );
        const httpError = new HttpException(
          "Sensitive error message",
          HttpStatus.BAD_REQUEST,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        productionInterceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe({
            error: (error: UniformErrorResponse) => {
              expect(error).toEqual({
                error: {
                  code: "BAD_REQUEST",
                  message: "[REDACTED]",
                  timestamp: expect.any(String) as unknown as string,
                  path: "/api/test",
                },
              });
              done();
            },
          });
      });

      it("should show actual error messages in development environment", (done) => {
        const developmentAppConfig = {
          nodeEnv: "development",
        } as jest.Mocked<AppConfig>;

        const developmentInterceptor = new ErrorResponseInterceptor(
          developmentAppConfig,
        );
        const httpError = new HttpException(
          "Detailed error message",
          HttpStatus.BAD_REQUEST,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        developmentInterceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe({
            error: (error: UniformErrorResponse) => {
              expect(error).toEqual({
                error: {
                  code: "BAD_REQUEST",
                  message: "Detailed error message",
                  timestamp: expect.any(String) as unknown as string,
                  path: "/api/test",
                },
              });
              done();
            },
          });
      });

      it("should show actual error messages in test environment", (done) => {
        const testAppConfig = {
          nodeEnv: "test",
        } as jest.Mocked<AppConfig>;

        const testInterceptor = new ErrorResponseInterceptor(testAppConfig);
        const httpError = new HttpException(
          "Test error message",
          HttpStatus.BAD_REQUEST,
        );
        mockCallHandler.handle.mockReturnValue(throwError(() => httpError));

        testInterceptor
          .intercept(mockExecutionContext, mockCallHandler)
          .subscribe({
            error: (error: UniformErrorResponse) => {
              expect(error).toEqual({
                error: {
                  code: "BAD_REQUEST",
                  message: "Test error message",
                  timestamp: expect.any(String) as unknown as string,
                  path: "/api/test",
                },
              });
              done();
            },
          });
      });
    });
  });
});
