import { Test, TestingModule } from "@nestjs/testing";
import { Request, Response } from "express";

import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { AppConfig, AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/utility";

import { AuthenticationMiddleware } from "./authentication.middleware";
import { AuthenticationService } from "./authentication.service";

describe("AuthenticationMiddleware", () => {
  let middleware: AuthenticationMiddleware;
  let authenticationService: jest.Mocked<AuthenticationService>;

  const mockTokenPayload = {
    aud: "test-client",
    jti: "test-jti",
    iss: "test-issuer",
    sub: "test-user",
    exp: 1234567890,
    iat: 1234567890,
    scope: "test:scope",
    hasScope: jest.fn(),
    sign: jest.fn(),
    hasNotExpired: jest.fn(),
    hasValidIssuer: jest.fn(),
  } satisfies TokenPayload;

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
            return await plainToConfig(
              {
                authUnprotectedPaths: ["/status*"],
              },
              AuthConfig.defaults(),
              AuthConfig,
            );
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

    it("should allow access to unprotected paths without authentication", async () => {
      const request = {
        ...mockRequest,
        originalUrl: "/status/health",
      } as Request;

      await middleware.use(request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authenticationService.authenticate).not.toHaveBeenCalled();
    });

    it("should allow access to unprotected paths with wildcard", async () => {
      const wildcardAuthConfig = await plainToConfig(
        {
          authUnprotectedPaths: ["/status*"],
        },
        AuthConfig.defaults(),
        AuthConfig,
      );
      const appConfig = await plainToConfig(
        {
          nodeEnv: "development",
        },
        AppConfig.defaults(),
        AppConfig,
      );

      const wildcardMiddleware = new AuthenticationMiddleware(
        authenticationService,
        wildcardAuthConfig,
        appConfig,
      );

      const request = {
        ...mockRequest,
        originalUrl: "/status/health",
      } as Request;

      await wildcardMiddleware.use(request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authenticationService.authenticate).not.toHaveBeenCalled();
    });

    it("should require authentication for non-unprotected paths", async () => {
      const request = {
        ...mockRequest,
        originalUrl: "/api/protected",
        headers: {
          authorization: "Bearer valid-token",
        },
      } as Request;
      authenticationService.authenticate.mockResolvedValue(mockTokenPayload);

      await middleware.use(request, mockResponse as Response, mockNext);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(authenticationService.authenticate).toHaveBeenCalledWith(
        "valid-token",
      );
      expect(mockNext).toHaveBeenCalled();
      expect(request.user).toBe(mockTokenPayload);
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

    it("should allow access to unprotected paths with wildcard", async () => {
      const wildcardAuthConfig = await plainToConfig(
        {
          authUnprotectedPaths: ["/status*"],
        },
        AuthConfig.defaults(),
        AuthConfig,
      );
      const appConfig = await plainToConfig(
        {
          nodeEnv: "production",
        },
        AppConfig.defaults(),
        AppConfig,
      );

      const wildcardMiddleware = new AuthenticationMiddleware(
        authenticationService,
        wildcardAuthConfig,
        appConfig,
      );

      const request = {
        ...mockRequest,
        protocol: "http",
        originalUrl: "/status/health",
      } as Request;

      await expect(
        wildcardMiddleware.use(request, mockResponse as Response, mockNext),
      ).rejects.toThrow(
        "Only https protocol is allowed in production environment.",
      );
    });
  });
});
