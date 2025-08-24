import { Test, TestingModule } from "@nestjs/testing";
import { createAuthorizationTestContext } from "@test/domain/authentication/Authorization.test-context";

import { CodeInterfaceSymbol } from "@domain/auth/OAuth/Authorization/Code/Code.interface";
import { PKCEInterfaceSymbol } from "@domain/auth/OAuth/Authorization/PKCE/PKCE.interface";
import { RequestInterfaceSymbol } from "@domain/auth/OAuth/Authorization/Request.interface";
import { ClientInterfaceSymbol } from "@domain/auth/OAuth/Client/Client.interface";
import { OauthRedirectUriMismatchException } from "@domain/auth/OAuth/Errors";
import { TokenPayloadInterfaceSymbol } from "@domain/auth/OAuth/Token";
import { UsersInterfaceSymbol } from "@domain/auth/OAuth/User";
import {
  EmailSanitizerInterfaceSymbol,
  PasswordInterfaceSymbol,
} from "@domain/auth/OAuth/User/Credentials";
import { ClockInterfaceSymbol } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AppConfig, AuthConfig } from "@infrastructure/config/configs";
import { EmailSanitizerService } from "@infrastructure/security/email/email-sanitizer.service";

import { AuthorizationService } from "./authorization.service";

describe("AuthorizationService", () => {
  let service: AuthorizationService;
  let testContext: Awaited<ReturnType<typeof createAuthorizationTestContext>>;

  beforeEach(async () => {
    testContext = await createAuthorizationTestContext();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationService,
        {
          provide: AppConfig,
          useValue: { nodeEnv: "test" },
        },
        {
          provide: AuthConfig,
          useValue: testContext.authConfig,
        },
        {
          provide: ClockInterfaceSymbol,
          useValue: testContext.clock,
        },
        {
          provide: RequestInterfaceSymbol,
          useValue: testContext.requests,
        },
        {
          provide: ClientInterfaceSymbol,
          useValue: testContext.clients,
        },
        {
          provide: UsersInterfaceSymbol,
          useValue: testContext.users,
        },
        {
          provide: CodeInterfaceSymbol,
          useValue: testContext.codes,
        },
        {
          provide: PasswordInterfaceSymbol,
          useValue: testContext.passwords,
        },
        {
          provide: PKCEInterfaceSymbol,
          useValue: testContext.PKCE,
        },
        {
          provide: TokenPayloadInterfaceSymbol,
          useValue: testContext.tokenPayloads,
        },
        {
          provide: EmailSanitizerInterfaceSymbol,
          useValue: new EmailSanitizerService(),
        },
      ],
    }).compile();

    service = module.get<AuthorizationService>(AuthorizationService);
  });

  describe("createAuthorizationRequest", () => {
    it("should create authorization request without redirect_uri", async () => {
      // Act
      const result = await service.createAuthorizationRequest({
        client_id: testContext.client.id.toString(),
        response_type: "code",
        scope: "task:api",
        state: "test-state",
        code_challenge: testContext.codeChallenge.toString(),
        code_challenge_method: "S256",
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.request_id).toBeDefined();
    });

    it("should create authorization request with valid redirect_uri", async () => {
      // Act
      const result = await service.createAuthorizationRequest({
        client_id: testContext.client.id.toString(),
        response_type: "code",
        scope: "task:api",
        state: "test-state",
        code_challenge: testContext.codeChallenge.toString(),
        code_challenge_method: "S256",
        redirect_uri: testContext.client.redirectUri.toString(),
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.request_id).toBeDefined();
    });

    it("should throw OauthRedirectUriMismatchException when redirect_uri does not match client's registered redirect_uri", async () => {
      // Act & Assert
      await expect(
        service.createAuthorizationRequest({
          client_id: testContext.client.id.toString(),
          response_type: "code",
          scope: "task:api",
          state: "test-state",
          code_challenge: testContext.codeChallenge.toString(),
          code_challenge_method: "S256",
          redirect_uri: "https://different-client.com/callback",
        }),
      ).rejects.toThrow(OauthRedirectUriMismatchException);
    });
  });

  describe("grantAuthorizationCode", () => {
    let requestId: string;

    beforeEach(async () => {
      // Create an authorization request first
      const authRequest = await service.createAuthorizationRequest({
        client_id: testContext.client.id.toString(),
        response_type: "code",
        scope: "task:api token:refresh",
        state: "test-state",
        code_challenge: testContext.codeChallenge.toString(),
        code_challenge_method: "S256",
      });

      requestId = authRequest.request_id;

      // Authorize the request to get an authorization code
      const request = await testContext.requests.retrieve(
        IdentityValue.fromString(authRequest.request_id),
      );
      request.issueAuthorizationCode(
        testContext.user.identity,
        testContext.codes,
        testContext.clock,
        testContext.authConfig,
      );
      await testContext.requests.persist(request);
    });

    it("should grant authorization code without redirect_uri", async () => {
      // Arrange
      const request = await testContext.requests.retrieve(
        IdentityValue.fromString(requestId),
      );
      const authCode = request.authorizationCode;
      expect(authCode).not.toBeNull();

      // Act
      const result = await service.grantAuthorizationCode({
        clientId: testContext.client.id.toString(),
        code: authCode!.code,
        codeVerifier: testContext.codeVerifier,
        redirectUri: undefined,
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should grant authorization code with valid redirect_uri", async () => {
      // Arrange
      const request = await testContext.requests.retrieve(
        IdentityValue.fromString(requestId),
      );
      const authCode = request.authorizationCode;
      expect(authCode).not.toBeNull();

      // Act
      const result = await service.grantAuthorizationCode({
        clientId: testContext.client.id.toString(),
        code: authCode!.code,
        codeVerifier: testContext.codeVerifier,
        redirectUri: testContext.client.redirectUri.toString(),
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it("should throw OauthRedirectUriMismatchException when redirect_uri does not match client's registered redirect_uri", async () => {
      // Arrange
      const request = await testContext.requests.retrieve(
        IdentityValue.fromString(requestId),
      );
      const authCode = request.authorizationCode;
      expect(authCode).not.toBeNull();

      // Act & Assert
      await expect(
        service.grantAuthorizationCode({
          clientId: testContext.client.id.toString(),
          code: authCode!.code,
          codeVerifier: testContext.codeVerifier,
          redirectUri: "https://different-client.com/callback",
        }),
      ).rejects.toThrow(OauthRedirectUriMismatchException);
    });
  });
});
