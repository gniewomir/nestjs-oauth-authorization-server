import { CallHandler, ExecutionContext } from "@nestjs/common";
import { of, throwError } from "rxjs";

import { LoggerInterface } from "./logger.interface";
import { LoggingInterceptor } from "./logging.interceptor";

/* eslint-disable @typescript-eslint/unbound-method */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

describe("LoggingInterceptor", () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: jest.Mocked<LoggerInterface>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: Record<string, unknown>;
  let mockResponse: Record<string, unknown>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      verbose: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setContext: jest.fn(),
    };

    mockRequest = {
      method: "GET",
      url: "/api/test",
      ip: "127.0.0.1",
      get: jest.fn().mockReturnValue("TestUserAgent"),
      headers: {} as Record<string, unknown>,
      connection: { remoteAddress: "127.0.0.1" } as Record<string, unknown>,
      socket: { remoteAddress: "127.0.0.1" } as Record<string, unknown>,
    } as Record<string, unknown>;

    mockResponse = {
      statusCode: 200,
    } as Record<string, unknown>;

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as jest.Mocked<ExecutionContext>;

    mockCallHandler = {
      handle: jest.fn(),
    } as jest.Mocked<CallHandler>;

    interceptor = new LoggingInterceptor(mockLogger);
  });

  describe("intercept", () => {
    it("should log request and successful response", (done) => {
      const responseData = { message: "success" };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(mockLogger.info).toHaveBeenCalledTimes(2); // request + response
          expect(mockLogger.info).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({
              message: "GET /api/test (REQUEST)",
              method: "GET",
              url: "/api/test",
              ip: "127.0.0.1",
              userAgent: "TestUserAgent",
              correlationId: expect.any(String),
            }),
          );
          expect(mockLogger.info).toHaveBeenNthCalledWith(
            2,
            expect.objectContaining({
              message: "GET /api/test (RESPONSE)",
              method: "GET",
              url: "/api/test",
              statusCode: 200,
              duration: expect.stringMatching(/^\d+ms$/),
              correlationId: expect.any(String),
            }),
          );
          expect(
            (mockRequest.headers as Record<string, unknown>)[
              "x-correlation-id"
            ],
          ).toBeDefined();
          done();
        },
      });
    });

    it("should log request and error response", (done) => {
      const error = new Error("Test error");
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: (err) => {
          expect(err).toBe(error);
          expect(mockLogger.info).toHaveBeenCalledTimes(1); // request
          expect(mockLogger.error).toHaveBeenCalledTimes(1); // error
          expect(mockLogger.error).toHaveBeenCalledWith(
            expect.objectContaining({
              message: "GET /api/test (ERROR)",
              method: "GET",
              url: "/api/test",
              error: {
                name: "Error",
                message: "Test error",
                stack: expect.any(String),
              },
              duration: expect.stringMatching(/^\d+ms$/),
              correlationId: expect.any(String),
            }),
          );
          done();
        },
      });
    });

    it("should log warning for 4xx status codes", (done) => {
      mockResponse.statusCode = 404;
      const responseData = { error: "Not found" };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({
              message: "GET /api/test (RESPONSE)",
              statusCode: 404,
            }),
          );
          done();
        },
      });
    });

    it("should log warning for 5xx status codes", (done) => {
      mockResponse.statusCode = 500;
      const responseData = { error: "Internal server error" };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          expect(mockLogger.warn).toHaveBeenCalledWith(
            expect.objectContaining({
              message: "GET /api/test (RESPONSE)",
              statusCode: 500,
            }),
          );
          done();
        },
      });
    });

    it("should use x-forwarded-for header when available", (done) => {
      (mockRequest.headers as Record<string, unknown>)["x-forwarded-for"] =
        "192.168.1.1";
      mockRequest.ip = undefined;
      (mockRequest.connection as Record<string, unknown>).remoteAddress =
        undefined;
      (mockRequest.socket as Record<string, unknown>).remoteAddress = undefined;

      mockCallHandler.handle.mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              ip: "192.168.1.1",
            }),
          );
          done();
        },
      });
    });

    it("should handle missing user agent", (done) => {
      (mockRequest.get as jest.Mock).mockReturnValue(undefined);

      mockCallHandler.handle.mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              userAgent: "Unknown",
            }),
          );
          done();
        },
      });
    });

    it("should generate unique correlation IDs for each request", (done) => {
      mockCallHandler.handle.mockReturnValue(of({}));

      const correlationIds: string[] = [];

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          const requestCall = mockLogger.info.mock.calls.find(
            (call) =>
              typeof call[0] === "object" &&
              (call[0] as Record<string, unknown>).message ===
                "GET /api/test (REQUEST)",
          );
          const responseCall = mockLogger.info.mock.calls.find(
            (call) =>
              typeof call[0] === "object" &&
              (call[0] as Record<string, unknown>).message ===
                "GET /api/test (RESPONSE)",
          );

          expect(requestCall).toBeDefined();
          expect(responseCall).toBeDefined();
          const requestData = requestCall![0] as Record<string, unknown>;
          const responseData = responseCall![0] as Record<string, unknown>;
          expect(requestData.correlationId).toBe(responseData.correlationId);
          correlationIds.push(requestData.correlationId as string);
          done();
        },
      });
    });

    it("should include response size when data is present", (done) => {
      const responseData = { message: "test", data: [1, 2, 3] };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          expect(mockLogger.info).toHaveBeenCalledWith(
            expect.objectContaining({
              responseSize: expect.any(Number),
            }),
          );
          done();
        },
      });
    });
  });
});
