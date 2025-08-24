import * as assert from "node:assert";

import {
  clientMother,
  createAuthenticationTestContext,
  requestMother,
} from "@test/domain/authentication";
import { createAuthorizationTestContext } from "@test/domain/authentication/Authorization.test-context";
import {
  accessTokenScopesMother,
  defaultTestClientScopesMother,
  refreshTokenScopesMother,
  rememberMeTestClientScopesMother,
} from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import { randomString } from "@test/index";

import { Assert } from "@domain/Assert";
import { AuthorizationFacade } from "@domain/auth/Authorization.facade";
import { Code } from "@domain/auth/OAuth/Authorization/Code/Code";
import { Request } from "@domain/auth/OAuth/Authorization/Request";
import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
import { EmailValue } from "@domain/auth/OAuth/User/Credentials/EmailValue";
import { PasswordValue } from "@domain/auth/OAuth/User/Credentials/PasswordValue";
import { RefreshTokenValue } from "@domain/auth/OAuth/User/RefreshTokenValue";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/utility";
import {
  ClientDomainRepositoryInMemory,
  RequestDomainRepositoryInMemory,
} from "@infrastructure/repositories/domain/authentication/OAuth";
import { JwtServiceFake } from "@infrastructure/security/jwt";

describe("AuthorizationFacade", () => {
  describe("request", () => {
    it("stores valid authorization request", async () => {
      const clients = new ClientDomainRepositoryInMemory();
      const client = clientMother();
      await clients.persist(client);

      const requests = new RequestDomainRepositoryInMemory();

      assert(requests.requests.size === 0);

      const request = await AuthorizationFacade.request(
        {
          ...requestMother({ redirectUri: client.redirectUri }),
          clientId: client.id,
        },
        requests,
        clients,
      );

      expect(requests.requests.size).toEqual(1);
      expect(request).toBeInstanceOf(Request);
    });
    it("rejects request, if oauth client does not exist", async () => {
      await expect(() =>
        AuthorizationFacade.request(
          requestMother(),
          new RequestDomainRepositoryInMemory(),
          new ClientDomainRepositoryInMemory(),
        ),
      ).rejects.toThrow("Client not found");
    });
    it("rejects request, if it contains scopes not available to the client", async () => {
      const scope = defaultTestClientScopesMother().remove(
        ScopeValue.ADMIN_API(),
      );
      const clients = new ClientDomainRepositoryInMemory();
      const client = clientMother({
        scope,
      });
      await clients.persist(client);

      await expect(() =>
        AuthorizationFacade.request(
          {
            ...requestMother({
              scope: scope.add(ScopeValue.ADMIN_API()),
            }),
            clientId: client.id,
          },
          new RequestDomainRepositoryInMemory(),
          clients,
        ),
      ).rejects.toThrow("Requested scope unavailable for provided client");
    });
  });
  describe("authorizePrompt", () => {
    it("accepts valid user credentials & creates authorization code", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
      } = await createAuthorizationTestContext();

      await AuthorizationFacade.request(
        { ...requestMother(), clientId: client.id, id: requestId },
        requests,
        clients,
      );

      await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      expect(
        requests.requests.get(requestId.toString())?.authorizationCode,
      ).toBeInstanceOf(Code);
    });
    it("rejects invalid user password", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
      } = await createAuthorizationTestContext();
      const invalidPassword = "invalidPassword";
      assert(userPassword !== invalidPassword);

      await AuthorizationFacade.request(
        { ...requestMother(), clientId: client.id, id: requestId },
        requests,
        clients,
      );

      await expect(() =>
        AuthorizationFacade.authorizePrompt(
          {
            requestId,
            credentials: {
              email: user.email,
              rememberMe: false,
              password: PasswordValue.fromString(invalidPassword),
            },
          },
          requests,
          users,
          passwords,
          codes,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("Password mismatch");
    });
    it("rejects invalid user email", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
      } = await createAuthorizationTestContext();
      const unknownEmail = "unknown@unknown.com";
      assert(user.email.toString() !== unknownEmail);

      await AuthorizationFacade.request(
        { ...requestMother(), clientId: client.id, id: requestId },
        requests,
        clients,
      );

      await expect(() =>
        AuthorizationFacade.authorizePrompt(
          {
            requestId,
            credentials: {
              email: EmailValue.fromString(unknownEmail),
              rememberMe: false,
              password: PasswordValue.fromString(userPassword),
            },
          },
          requests,
          users,
          passwords,
          codes,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("User not found");
    });
  });
  describe("authorizationCodeGrant", () => {
    it("allows exchange of authorization code for tokens", async () => {
      const scope = defaultTestClientScopesMother();
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
        PKCE,
        tokenPayloads,
        codeChallenge,
        codeVerifier,
      } = await createAuthorizationTestContext({ clientScope: scope });

      await AuthorizationFacade.request(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
          scope,
        },
        requests,
        clients,
      );

      const { authorizationCode } = await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      Assert(authorizationCode !== null);

      const { idToken, accessToken, refreshToken, expiresAt } =
        await AuthorizationFacade.authorizationCodeGrant(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
          clients,
        );

      Assert(typeof idToken !== "undefined");
      Assert(typeof refreshToken !== "undefined");

      await expect(tokenPayloads.verifyIdToken(idToken)).resolves.not.toThrow();
      await expect(tokenPayloads.verify(accessToken)).resolves.not.toThrow();
      const decodedAccessToken = await tokenPayloads.decode(accessToken);
      expect(decodedAccessToken.exp).toBeGreaterThanOrEqual(expiresAt);
      expect(decodedAccessToken.exp).toBeLessThan(expiresAt + 2);
      expect(decodedAccessToken.scope).toBe(
        accessTokenScopesMother().toString(),
      );

      await expect(tokenPayloads.verify(refreshToken)).resolves.not.toThrow();
      const decodedRefreshToken = await tokenPayloads.decode(refreshToken);
      expect(decodedRefreshToken.exp).toBeLessThanOrEqual(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtRefreshTokenExpirationSeconds,
      );
      expect(decodedRefreshToken.exp).toBeLessThan(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtRefreshTokenExpirationSeconds +
          2,
      );
      expect(decodedRefreshToken.scope).toBe(
        refreshTokenScopesMother().toString(),
      );
    });
    it("if user indicated that he wants to stay being logged - refresh token will have longer ttl", async () => {
      const scope = rememberMeTestClientScopesMother();
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
        PKCE,
        tokenPayloads,
        codeChallenge,
        codeVerifier,
      } = await createAuthorizationTestContext({
        clientScope: scope,
      });

      await AuthorizationFacade.request(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
          scope: scope.add(ScopeValue.TOKEN_REFRESH_ISSUE_LARGE_TTL()),
        },
        requests,
        clients,
      );

      const { authorizationCode } = await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      Assert(authorizationCode !== null);

      const { idToken, accessToken, expiresAt, refreshToken } =
        await AuthorizationFacade.authorizationCodeGrant(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
          clients,
        );

      Assert(typeof idToken !== "undefined");
      Assert(typeof refreshToken !== "undefined");

      await expect(tokenPayloads.verifyIdToken(idToken)).resolves.not.toThrow();
      await expect(tokenPayloads.verify(accessToken)).resolves.not.toThrow();
      const decodedAccessToken = await tokenPayloads.decode(accessToken);
      expect(decodedAccessToken.exp).toBeGreaterThanOrEqual(expiresAt);
      expect(decodedAccessToken.exp).toBeLessThan(expiresAt + 2);
      expect(decodedAccessToken.scope).toBe(
        scope.remove(ScopeValue.TOKEN_REFRESH()).toString(),
      );

      await expect(tokenPayloads.verify(refreshToken)).resolves.not.toThrow();
      const decodedRefreshToken = await tokenPayloads.decode(refreshToken);
      expect(decodedRefreshToken.exp).toBeGreaterThanOrEqual(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtLongTTLRefreshTokenExpirationSeconds,
      );
      expect(decodedRefreshToken.exp).toBeLessThan(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtLongTTLRefreshTokenExpirationSeconds +
          2,
      );
      expect(decodedRefreshToken.scope).toBe(
        scope.remove(ScopeValue.TOKEN_AUTHENTICATE()).toString(),
      );
    });
    it("authorization code can be used only once", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
        PKCE,
        tokenPayloads,
        codeChallenge,
        codeVerifier,
      } = await createAuthorizationTestContext();

      const scope = ScopeValueImmutableSet.fromString("task:api");
      await AuthorizationFacade.request(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
          scope,
        },
        requests,
        clients,
      );

      const { authorizationCode } = await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      Assert(authorizationCode !== null);

      await AuthorizationFacade.authorizationCodeGrant(
        {
          clientId: client.id,
          code: authorizationCode.toString(),
          codeVerifier,
        },
        requests,
        PKCE,
        clock,
        authConfig,
        users,
        tokenPayloads,
        clients,
      );

      await expect(
        AuthorizationFacade.authorizationCodeGrant(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
          clients,
        ),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });
    it("authorization code cannot be used if it expired", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
        PKCE,
        tokenPayloads,
        codeChallenge,
        codeVerifier,
      } = await createAuthorizationTestContext();

      await AuthorizationFacade.request(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
        },
        requests,
        clients,
      );

      const { authorizationCode } = await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      Assert(authorizationCode !== null);

      clock.timeTravelSeconds(authorizationCode.expires.toNumber());

      await expect(
        AuthorizationFacade.authorizationCodeGrant(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
          clients,
        ),
      ).rejects.toThrow(
        "Authorization code not found, already used, or expired",
      );
    });

    it("it rejects exchange if PKCE verifier does not match code challenge", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
        PKCE,
        tokenPayloads,
        codeChallenge,
      } = await createAuthorizationTestContext();

      const scope = ScopeValueImmutableSet.fromString("task:api");
      await AuthorizationFacade.request(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
          scope,
        },
        requests,
        clients,
      );

      const { authorizationCode } = await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      Assert(authorizationCode !== null);

      await expect(
        AuthorizationFacade.authorizationCodeGrant(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier: PKCE.generateCodeVerifier(),
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
          clients,
        ),
      ).rejects.toThrow("Failed PKCE code challenge");
    });

    it("stores issued refresh tokens", async () => {
      const {
        requests,
        requestId,
        users,
        userPassword,
        user,
        authConfig,
        passwords,
        codes,
        clock,
        clients,
        client,
        PKCE,
        tokenPayloads,
        codeChallenge,
        codeVerifier,
      } = await createAuthorizationTestContext();

      const scope = ScopeValueImmutableSet.fromString("token:refresh");
      await AuthorizationFacade.request(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
          scope,
        },
        requests,
        clients,
      );

      const { authorizationCode } = await AuthorizationFacade.authorizePrompt(
        {
          requestId,
          credentials: {
            email: user.email,
            rememberMe: false,
            password: PasswordValue.fromString(userPassword),
          },
        },
        requests,
        users,
        passwords,
        codes,
        clock,
        authConfig,
      );

      Assert(authorizationCode !== null);

      const { refreshToken } = await AuthorizationFacade.authorizationCodeGrant(
        {
          clientId: client.id,
          code: authorizationCode.toString(),
          codeVerifier,
        },
        requests,
        PKCE,
        clock,
        authConfig,
        users,
        tokenPayloads,
        clients,
      );

      const freshUser = await users.retrieve(user.identity);

      Assert(typeof refreshToken !== "undefined");
      const decodedRefreshToken = await tokenPayloads.decode(refreshToken);

      expect(
        freshUser.hasRefreshToken(
          IdentityValue.fromString(decodedRefreshToken.jti),
          clock,
        ),
      ).toEqual(true);
    });
  });
  describe("refreshTokenGrant", () => {
    it("accepts valid refresh token", async () => {
      const { tokenPayloads, clock, authConfig, refreshToken, users, clients } =
        await createAuthenticationTestContext({
          requestedScopes: ScopeValueImmutableSet.fromString(
            "token:authenticate token:refresh task:api",
          ),
        });

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          refreshToken || "",
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).resolves.not.toThrow();
    });
    it("issues new idToken, accessToken and refresh token and provides accessToken expiration", async () => {
      const scope = defaultTestClientScopesMother();
      const {
        tokenPayloads,
        clock,
        authConfig,
        refreshToken: receivedRefreshToken,
        users,
        clients,
      } = await createAuthenticationTestContext({
        requestedScopes: scope,
      });

      Assert(typeof receivedRefreshToken !== "undefined");

      const { idToken, accessToken, refreshToken, expiresAt } =
        await AuthorizationFacade.refreshTokenGrant(
          receivedRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        );

      Assert(scope.hasScope(ScopeValue.PROFILE()) && !!idToken);
      await expect(tokenPayloads.verifyIdToken(idToken)).resolves.not.toThrow();
      await expect(tokenPayloads.verify(accessToken)).resolves.not.toThrow();
      const decodedAccessToken = await tokenPayloads.decode(accessToken);
      expect(decodedAccessToken.exp).toBeGreaterThanOrEqual(expiresAt);
      expect(decodedAccessToken.exp).toBeLessThan(expiresAt + 2);
      expect(decodedAccessToken.scope).toBe(
        scope.remove(ScopeValue.TOKEN_REFRESH()).toString(),
      );
      Assert(scope.hasScope(ScopeValue.TOKEN_REFRESH()) && !!refreshToken);
      await expect(tokenPayloads.verify(refreshToken)).resolves.not.toThrow();
      const decodedRefreshToken = await tokenPayloads.decode(refreshToken);
      expect(decodedRefreshToken.exp).toBeGreaterThanOrEqual(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtRefreshTokenExpirationSeconds,
      );
      expect(decodedRefreshToken.exp).toBeLessThan(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtRefreshTokenExpirationSeconds +
          2,
      );
      expect(decodedRefreshToken.scope).toBe(
        scope.remove(ScopeValue.TOKEN_AUTHENTICATE()).toString(),
      );
    });
    it("passes on scopes contained in received refresh token", async () => {
      const scope = defaultTestClientScopesMother();
      const {
        tokenPayloads,
        clock,
        authConfig,
        refreshToken: receivedRefreshToken,
        users,
        clients,
      } = await createAuthenticationTestContext({
        requestedScopes: scope,
      });

      Assert(typeof receivedRefreshToken !== "undefined");

      const { accessToken, refreshToken } =
        await AuthorizationFacade.refreshTokenGrant(
          receivedRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        );

      await expect(tokenPayloads.decode(accessToken)).resolves.toMatchObject({
        scope: scope.remove(ScopeValue.TOKEN_REFRESH()).toString(),
      });
      Assert(scope.hasScope(ScopeValue.TOKEN_REFRESH()) && !!refreshToken);
      await expect(tokenPayloads.decode(refreshToken)).resolves.toMatchObject({
        scope: scope.remove(ScopeValue.TOKEN_AUTHENTICATE()).toString(),
      });
    });
    it("issues refresh token with longer ttl, if refresh token contained required scope", async () => {
      const scope = rememberMeTestClientScopesMother();
      const {
        tokenPayloads,
        clock,
        authConfig,
        refreshToken: receivedRefreshToken,
        users,
        clients,
      } = await createAuthenticationTestContext({
        requestedScopes: scope,
      });

      Assert(typeof receivedRefreshToken !== "undefined");

      const { accessToken, refreshToken, expiresAt } =
        await AuthorizationFacade.refreshTokenGrant(
          receivedRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        );

      await expect(tokenPayloads.decode(accessToken)).resolves.toMatchObject({
        scope: scope.remove(ScopeValue.TOKEN_REFRESH()).toString(),
      });
      Assert(scope.hasScope(ScopeValue.TOKEN_REFRESH()) && !!refreshToken);
      const decodedRefreshToken = await tokenPayloads.decode(refreshToken);
      expect(decodedRefreshToken.exp).toBeGreaterThanOrEqual(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtLongTTLRefreshTokenExpirationSeconds,
      );
      expect(decodedRefreshToken.exp).toBeLessThan(
        expiresAt -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtLongTTLRefreshTokenExpirationSeconds +
          2,
      );
      expect(decodedRefreshToken.scope).toBe(
        scope.remove(ScopeValue.TOKEN_AUTHENTICATE()).toString(),
      );
    });
    it("rejects idToken", async () => {
      const { idToken, tokenPayloads, clock, authConfig, users, clients } =
        await createAuthenticationTestContext();

      Assert(typeof idToken !== "undefined");

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          idToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects access token", async () => {
      const { accessToken, tokenPayloads, clock, authConfig, users, clients } =
        await createAuthenticationTestContext();

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          accessToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects expired refresh token", async () => {
      const { tokenPayloads, clock, authConfig, refreshToken, users, clients } =
        await createAuthenticationTestContext();

      clock.timeTravelSeconds(
        clock.nowAsSecondsSinceEpoch() +
          authConfig.jwtRefreshTokenExpirationSeconds,
      );

      Assert(typeof refreshToken !== "undefined");

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          refreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("jwt expired");
    });
    it("rejects garbled refresh token", async () => {
      const { tokenPayloads, clock, authConfig, users, clients } =
        await createAuthenticationTestContext();

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          randomString(1024),
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("jwt malformed");
    });
    it("rejects refresh token signed with invalid secret/key", async () => {
      const { tokenPayloads, clock, authConfig, user, users, client, clients } =
        await createAuthenticationTestContext();

      const modifiedAuthConfig = await plainToConfig(
        {
          jwtKeyPath: "src/test/keys/theirs-key-es512",
        },
        authConfig,
        AuthConfig,
      );
      const tokenPayloadsWithModifiedConfig = new JwtServiceFake(
        modifiedAuthConfig,
      );
      const newRefreshToken = TokenPayload.createRefreshToken({
        clock,
        authConfig,
        user,
        scope: defaultTestClientScopesMother(),
        client,
      });
      /**
       * Perfectly valid token - but signed with different key
       */
      const accessTokenWithInvalidSignature = await newRefreshToken.sign(
        tokenPayloadsWithModifiedConfig,
      );
      user.rotateRefreshToken(
        RefreshTokenValue.fromTokenPayload(newRefreshToken),
        clock,
      );
      await users.persist(user);

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          accessTokenWithInvalidSignature,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("invalid signature");
    });
    it("rejects refresh token with invalid issuer", async () => {
      const { tokenPayloads, clock, authConfig, user, users, client, clients } =
        await createAuthenticationTestContext();

      const modifiedAuthConfig = await plainToConfig(
        {
          jwtIssuer: "John Doe <john.doe@gmail.com>",
        },
        authConfig,
        AuthConfig,
      );
      const tokenPayloadsWithModifiedConfig = new JwtServiceFake(
        modifiedAuthConfig,
      );
      const newRefreshToken = TokenPayload.createRefreshToken({
        user,
        authConfig: modifiedAuthConfig,
        scope: defaultTestClientScopesMother(),
        clock,
        client,
      });
      const invalidRefreshToken = await newRefreshToken.sign(
        tokenPayloadsWithModifiedConfig,
      );

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          invalidRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("jwt has invalid issuer");
    });
    it("rejects refresh token lacking required scope", async () => {
      const { tokenPayloads, clock, authConfig, user, users, client, clients } =
        await createAuthenticationTestContext();

      const newRefreshToken = TokenPayload.createRefreshToken({
        user,
        authConfig,
        scope: defaultTestClientScopesMother().remove(
          ScopeValue.TOKEN_REFRESH(),
        ),
        clock,
        client,
      });
      const invalidRefreshToken = await newRefreshToken.sign(tokenPayloads);

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          invalidRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects not known refresh tokens", async () => {
      const { tokenPayloads, clock, authConfig, users, clients, client, user } =
        await createAuthenticationTestContext();

      const notStoredRefreshToken = TokenPayload.createRefreshToken({
        user,
        authConfig,
        scope: defaultTestClientScopesMother(),
        clock,
        client,
      });
      const signedNotStoredRefreshToken =
        await notStoredRefreshToken.sign(tokenPayloads);

      await expect(
        AuthorizationFacade.refreshTokenGrant(
          signedNotStoredRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("refresh token is not found on user");
    });
    it("rotates spent refresh token", async () => {
      const {
        tokenPayloads,
        clock,
        authConfig,
        refreshToken: spentRefreshToken,
        users,
        clients,
        user,
      } = await createAuthenticationTestContext();

      Assert(typeof spentRefreshToken !== "undefined");

      const { refreshToken: issuedRefreshToken } =
        await AuthorizationFacade.refreshTokenGrant(
          spentRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        );

      const decodedUsedRefreshToken =
        await tokenPayloads.decode(spentRefreshToken);
      Assert(issuedRefreshToken !== undefined);
      const decodedIssuedRefreshToken =
        await tokenPayloads.decode(issuedRefreshToken);
      const freshUser = await users.retrieve(user.identity);

      expect(
        freshUser.hasRefreshToken(
          IdentityValue.fromString(decodedUsedRefreshToken.jti),
          clock,
        ),
      ).toEqual(false);
      expect(
        freshUser.hasRefreshToken(
          IdentityValue.fromString(decodedIssuedRefreshToken.jti),
          clock,
        ),
      ).toEqual(true);
    });
  });

  describe("registerPrompt", () => {
    it.todo("should successfully register a new user");

    it.todo("should throw error when email already exists");

    it.todo(
      "should throw error when client does not allow registration of new users",
    );
  });
});
