import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";

import { ClockInterfaceSymbol } from "@domain/Clock.interface";
import { ClockServiceFake } from "@infrastructure/clock";

import { CsrfMiddleware } from "./csrf.middleware";
import { CsrfService } from "./csrf.service";

describe("CsrfMiddleware", () => {
  let middleware: CsrfMiddleware;
  let csrfService: CsrfService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CsrfMiddleware,
        CsrfService,
        {
          provide: ClockInterfaceSymbol,
          useClass: ClockServiceFake,
        },
      ],
    }).compile();

    middleware = module.get<CsrfMiddleware>(CsrfMiddleware);
    csrfService = module.get<CsrfService>(CsrfService);
  });

  beforeEach(() => {
    mockRequest = {
      method: "POST",
      path: "/oauth/prompt",
      body: {},
    };
    mockResponse = {};
    nextFunction = jest.fn();
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  describe("POST /oauth/prompt", () => {
    it("should call next() when CSRF token is valid", () => {
      const requestId = "test-request-id";
      const csrfToken = csrfService.generateToken(requestId);

      mockRequest.body = {
        request_id: requestId,
        _csrf: csrfToken,
      };

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it("should throw BadRequestException when request_id is missing", () => {
      const csrfToken = csrfService.generateToken("test-request-id");

      mockRequest.body = {
        _csrf: csrfToken,
      };

      expect(() => {
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );
      }).toThrow("Missing CSRF token or request ID");

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when _csrf is missing", () => {
      mockRequest.body = {
        request_id: "test-request-id",
      };

      expect(() => {
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );
      }).toThrow("Missing CSRF token or request ID");

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when CSRF token is invalid", () => {
      mockRequest.body = {
        request_id: "test-request-id",
        _csrf: "invalid-token",
      };

      expect(() => {
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );
      }).toThrow("Invalid CSRF token");

      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException when CSRF token is for different request", () => {
      const requestId1 = "request-1";
      const requestId2 = "request-2";
      const csrfToken = csrfService.generateToken(requestId1);

      mockRequest.body = {
        request_id: requestId2,
        _csrf: csrfToken,
      };

      expect(() => {
        middleware.use(
          mockRequest as Request,
          mockResponse as Response,
          nextFunction,
        );
      }).toThrow("Invalid CSRF token");

      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe("other routes", () => {
    it("should call next() for GET requests", () => {
      mockRequest.method = "GET";

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it("should call next() for different paths", () => {
      const differentPathRequest = {
        ...mockRequest,
        path: "/other/path",
      };

      middleware.use(
        differentPathRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it("should call next() for different HTTP methods", () => {
      mockRequest.method = "PUT";

      middleware.use(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction,
      );

      expect(nextFunction).toHaveBeenCalledWith();
    });
  });
});
