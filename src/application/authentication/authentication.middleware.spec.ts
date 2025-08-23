import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";

import { AppConfig, AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/utility";

import { AuthenticationMiddleware } from "./authentication.middleware";
import { AuthenticationService } from "./authentication.service";

describe("AuthenticationMiddleware", () => {
  let middleware: AuthenticationMiddleware;
  let authenticationService: jest.Mocked<AuthenticationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticationMiddleware,
        {
          provide: AuthenticationService,
          useValue: {
            authenticate: jest.fn(),
          },
        },
        {
          provide: AuthConfig,
          useFactory: async () => {
            return await plainToConfig({}, AuthConfig.defaults(), AuthConfig);
          },
        },
        {
          provide: AppConfig,
          useFactory: async () => {
            return await plainToConfig(
              {
                nodeEnv: "development",
              },
              AppConfig.defaults(),
              AppConfig,
            );
          },
        },
      ],
    }).compile();

    middleware = module.get<AuthenticationMiddleware>(AuthenticationMiddleware);
    authenticationService = module.get(AuthenticationService);
  });

  it("should be defined", () => {
    expect(middleware).toBeDefined();
  });

  describe("use", () => {
    let mockRequest: Partial<Request>;
    let mockResponse: Partial<Response>;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockRequest = {
        originalUrl: "/api/protected",
        headers: {},
      };
      mockResponse = {};
      mockNext = jest.fn();
    });

    it("should throw UnauthorizedException for missing Authorization header", async () => {
      const request = {
        ...mockRequest,
        originalUrl: "/api/protected",
        headers: {},
      } as Request;

      await expect(
        middleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow("Missing or invalid Authorization header");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid Authorization header format", async () => {
      const request = {
        ...mockRequest,
        originalUrl: "/api/protected",
        headers: {
          authorization: "InvalidFormat token",
        },
      } as Request;

      await expect(
        middleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow("Missing or invalid Authorization header");

      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw UnauthorizedException for invalid token", async () => {
      const request = {
        ...mockRequest,
        originalUrl: "/api/protected",
        headers: {
          authorization: "Bearer invalid-token",
        },
      } as Request;
      authenticationService.authenticate.mockRejectedValue(
        new Error("Invalid token"),
      );

      await expect(
        middleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow("Invalid or expired token");

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
