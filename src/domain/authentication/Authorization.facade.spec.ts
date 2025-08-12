import { ClientDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/Client/Client.domain-repository.in-memory";
import { clientMother, requestMother } from "@test/domain/authentication";
import { RequestDomainRepositoryInMemory } from "@infrastructure/repositories/domain/authentication/OAuth/Request/Request.domain-repository.in-memory";
import { AuthorizationFacade } from "@domain/authentication/Authorization.facade";
import { Request } from "@domain/authentication/OAuth/Authorization/Request";
import * as assert from "node:assert";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";
import { Code } from "@domain/authentication/OAuth/Authorization/Code/Code";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/User/Token/Scope/ScopeImmutableSet";
import { createAuthorizationTestContext } from "@test/domain/authentication/Authorization.test-context";

describe("AuthorizationFacade", () => {
  describe("authorizationRequest", () => {
    it("stores valid authorization request", async () => {
      const clients = new ClientDomainRepositoryInMemory();
      const client = clientMother();
      await clients.persist(client);

      const requests = new RequestDomainRepositoryInMemory();

      assert(requests.requests.size === 0);

      const request = await AuthorizationFacade.authorizationRequest(
        { ...requestMother(), clientId: client.id },
        requests,
        clients,
      );

      expect(requests.requests.size).toEqual(1);
      expect(request).toBeInstanceOf(Request);
    });
    it("rejects request, if oauth client does not exist", async () => {
      await expect(() =>
        AuthorizationFacade.authorizationRequest(
          requestMother(),
          new RequestDomainRepositoryInMemory(),
          new ClientDomainRepositoryInMemory(),
        ),
      ).rejects.toThrow("Not found");
    });
  });
  describe("authorizationPrompt", () => {
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

      await AuthorizationFacade.authorizationRequest(
        { ...requestMother(), clientId: client.id, id: requestId },
        requests,
        clients,
      );

      await AuthorizationFacade.authorizationPrompt(
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

      await AuthorizationFacade.authorizationRequest(
        { ...requestMother(), clientId: client.id, id: requestId },
        requests,
        clients,
      );

      await expect(() =>
        AuthorizationFacade.authorizationPrompt(
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

      await AuthorizationFacade.authorizationRequest(
        { ...requestMother(), clientId: client.id, id: requestId },
        requests,
        clients,
      );

      await expect(() =>
        AuthorizationFacade.authorizationPrompt(
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
      ).rejects.toThrow("Not found");
    });
  });
  describe("authorizationCodeExchange", () => {
    it("allows exchange of authorization code for tokens", async () => {
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

      const scope = ScopeImmutableSet.fromString("customer:api");
      const request = await AuthorizationFacade.authorizationRequest(
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

      const { authorizationCode } =
        await AuthorizationFacade.authorizationPrompt(
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

      const { idToken, accessToken, expiration, refreshToken } =
        await AuthorizationFacade.authorizationCodeExchange(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
            redirectUri: request.redirectUri,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
        );

      await expect(tokenPayloads.verifyIdToken(idToken)).resolves.not.toThrow();
      await expect(tokenPayloads.verify(accessToken)).resolves.not.toThrow();
      await expect(tokenPayloads.decode(accessToken)).resolves.toMatchObject({
        exp: expiration,
        scope: ScopeImmutableSet.fromArray([
          "customer:api",
          "token:authenticate",
        ]).toString(),
      });
      await expect(tokenPayloads.verify(refreshToken)).resolves.not.toThrow();
      await expect(tokenPayloads.decode(refreshToken)).resolves.toMatchObject({
        exp:
          expiration -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtRefreshTokenExpirationSeconds,
        scope: ScopeImmutableSet.fromArray([
          "customer:api",
          "token:refresh",
        ]).toString(),
      });
    });
    it("if user indicated that he wants to stay being logged - refresh token will have longer ttl", async () => {
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

      const scope = ScopeImmutableSet.fromArray([
        "customer:api",
        "token:refresh:issue-large-ttl",
      ]);
      const request = await AuthorizationFacade.authorizationRequest(
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

      const { authorizationCode } =
        await AuthorizationFacade.authorizationPrompt(
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

      const { idToken, accessToken, expiration, refreshToken } =
        await AuthorizationFacade.authorizationCodeExchange(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
            redirectUri: request.redirectUri,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
        );

      await expect(tokenPayloads.verifyIdToken(idToken)).resolves.not.toThrow();
      await expect(tokenPayloads.verify(accessToken)).resolves.not.toThrow();
      await expect(tokenPayloads.decode(accessToken)).resolves.toMatchObject({
        exp: expiration,
        scope: ScopeImmutableSet.fromArray([
          "customer:api",
          "token:authenticate",
          "token:refresh:issue-large-ttl",
        ]).toString(),
      });
      await expect(tokenPayloads.verify(refreshToken)).resolves.not.toThrow();
      await expect(tokenPayloads.decode(refreshToken)).resolves.toMatchObject({
        exp:
          expiration -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtLongTTLRefreshTokenExpirationSeconds,
        scope: ScopeImmutableSet.fromArray([
          "customer:api",
          "token:refresh",
          "token:refresh:issue-large-ttl",
        ]).toString(),
      });
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

      const scope = ScopeImmutableSet.fromString("customer:api");
      const request = await AuthorizationFacade.authorizationRequest(
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

      const { authorizationCode } =
        await AuthorizationFacade.authorizationPrompt(
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

      await AuthorizationFacade.authorizationCodeExchange(
        {
          clientId: client.id,
          code: authorizationCode.toString(),
          codeVerifier,
          redirectUri: request.redirectUri,
        },
        requests,
        PKCE,
        clock,
        authConfig,
        users,
        tokenPayloads,
      );

      await expect(
        AuthorizationFacade.authorizationCodeExchange(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
            redirectUri: request.redirectUri,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
        ),
      ).rejects.toThrow("Authorization Code already used!");
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

      const request = await AuthorizationFacade.authorizationRequest(
        {
          ...requestMother(),
          clientId: client.id,
          id: requestId,
          codeChallenge,
        },
        requests,
        clients,
      );

      const { authorizationCode } =
        await AuthorizationFacade.authorizationPrompt(
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

      clock.timeTravelSeconds(authorizationCode.expiration);

      await expect(
        AuthorizationFacade.authorizationCodeExchange(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier,
            redirectUri: request.redirectUri,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
        ),
      ).rejects.toThrow("Authorization code expired!");
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

      const scope = ScopeImmutableSet.fromString("customer:api");
      const request = await AuthorizationFacade.authorizationRequest(
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

      const { authorizationCode } =
        await AuthorizationFacade.authorizationPrompt(
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

      await expect(
        AuthorizationFacade.authorizationCodeExchange(
          {
            clientId: client.id,
            code: authorizationCode.toString(),
            codeVerifier: PKCE.generateCodeVerifier(),
            redirectUri: request.redirectUri,
          },
          requests,
          PKCE,
          clock,
          authConfig,
          users,
          tokenPayloads,
        ),
      ).rejects.toThrow("Failed PKCE code challenge");
    });
  });
});
