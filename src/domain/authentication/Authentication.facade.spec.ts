import { createAuthenticationTestContext } from "@test/domain/authentication/Authentication.test-context";
import {
  accessTokenScopesMother,
  defaultTestClientScopesMother,
  rememberMeTestClientScopesMother,
} from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import { randomString } from "@test/utility/randomString";

import { Assert } from "@domain/Assert";
import { AuthenticationFacade } from "@domain/authentication/Authentication.facade";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/configs/utility";
import { JwtServiceFake } from "@infrastructure/security/jwt";

describe("AuthenticationFacade", () => {
  describe("authenticate", () => {
    it("accept valid access token", async () => {
      const { accessToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationTestContext();

      await expect(
        AuthenticationFacade.authenticate(
          accessToken,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).resolves.not.toThrow();
    });
    it("rejects idToken", async () => {
      const { idToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationTestContext();

      await expect(
        AuthenticationFacade.authenticate(
          idToken || "",
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects refresh token", async () => {
      const { refreshToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationTestContext();

      await expect(
        AuthenticationFacade.authenticate(
          refreshToken || "",
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects expired access token", async () => {
      const { accessToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationTestContext();

      clock.timeTravelSeconds(
        clock.nowAsSecondsSinceEpoch() +
          authConfig.jwtAccessTokenExpirationSeconds,
      );

      await expect(
        AuthenticationFacade.authenticate(
          accessToken,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt expired");
    });

    it("rejects garbled access token", async () => {
      const { tokenPayloads, clock, authConfig } =
        await createAuthenticationTestContext();

      await expect(
        AuthenticationFacade.authenticate(
          randomString(1024),
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt malformed");
    });
    it("rejects access token signed with invalid secret/key", async () => {
      const { tokenPayloads, clock, authConfig, user, client } =
        await createAuthenticationTestContext();

      const modifiedAuthConfig = await plainToConfig(
        {
          ...authConfig,
          jwtSecret: randomString(64),
        },
        AuthConfig,
      );
      const tokenPayloadsWithModifiedConfig = new JwtServiceFake(
        modifiedAuthConfig,
      );
      const newToken = TokenPayload.createAccessToken({
        user,
        authConfig,
        clock,
        scope: accessTokenScopesMother(),
        client,
      });
      const accessTokenWithInvalidSignature = await newToken.sign(
        tokenPayloadsWithModifiedConfig,
      );

      await expect(
        AuthenticationFacade.authenticate(
          accessTokenWithInvalidSignature,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("invalid signature");
    });
    it("rejects access token with invalid issuer", async () => {
      const { tokenPayloads, clock, authConfig, user, client } =
        await createAuthenticationTestContext();

      const modifiedAuthConfig = await plainToConfig(
        {
          ...authConfig,
          jwtIssuer: "John Doe <john.doe@gmail.com>",
        },
        AuthConfig,
      );
      const tokenPayloadsWithModifiedConfig = new JwtServiceFake(
        modifiedAuthConfig,
      );
      const newToken = TokenPayload.createAccessToken({
        user,
        authConfig: modifiedAuthConfig,
        scope: accessTokenScopesMother(),
        clock,
        client,
      });
      const invalidToken = await newToken.sign(tokenPayloadsWithModifiedConfig);

      await expect(
        AuthenticationFacade.authenticate(
          invalidToken,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt has invalid issuer");
    });
    it("rejects access token lacking required scope", async () => {
      const requestedScopes = ScopeValueImmutableSet.fromArray([
        ScopeValue.TASK_API(),
        ScopeValue.TOKEN_AUTHENTICATE(),
      ]);
      const { tokenPayloads, clock, authConfig, user, client } =
        await createAuthenticationTestContext({
          requestedScopes,
        });

      const accessToken = TokenPayload.createAccessToken({
        user,
        authConfig,
        clock,
        scope: requestedScopes.remove(ScopeValue.TOKEN_AUTHENTICATE()),
        client,
      });

      await expect(
        AuthenticationFacade.authenticate(
          await accessToken.sign(tokenPayloads),
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
  });
  describe("refresh", () => {
    it("accepts valid refresh token", async () => {
      const { tokenPayloads, clock, authConfig, refreshToken, users, clients } =
        await createAuthenticationTestContext({
          requestedScopes: ScopeValueImmutableSet.fromString(
            "token:authenticate token:refresh task:api",
          ),
        });

      await expect(
        AuthenticationFacade.refresh(
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

      const { idToken, accessToken, refreshToken, expiration } =
        await AuthenticationFacade.refresh(
          receivedRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        );

      await expect(tokenPayloads.verifyIdToken(idToken)).resolves.not.toThrow();
      await expect(tokenPayloads.verify(accessToken)).resolves.not.toThrow();
      await expect(tokenPayloads.decode(accessToken)).resolves.toMatchObject({
        exp: expiration,
        scope: scope.remove(ScopeValue.TOKEN_REFRESH()).toString(),
      });
      await expect(tokenPayloads.verify(refreshToken)).resolves.not.toThrow();
      await expect(tokenPayloads.decode(refreshToken)).resolves.toMatchObject({
        exp:
          expiration -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtRefreshTokenExpirationSeconds,
        scope: scope.remove(ScopeValue.TOKEN_AUTHENTICATE()).toString(),
      });
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

      const { accessToken, refreshToken } = await AuthenticationFacade.refresh(
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

      const { accessToken, refreshToken, expiration } =
        await AuthenticationFacade.refresh(
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
      await expect(tokenPayloads.decode(refreshToken)).resolves.toMatchObject({
        exp:
          expiration -
          authConfig.jwtAccessTokenExpirationSeconds +
          authConfig.jwtLongTTLRefreshTokenExpirationSeconds,
        scope: scope.remove(ScopeValue.TOKEN_AUTHENTICATE()).toString(),
      });
    });
    it("rejects idToken", async () => {
      const { idToken, tokenPayloads, clock, authConfig, users, clients } =
        await createAuthenticationTestContext();

      Assert(typeof idToken !== "undefined");

      await expect(
        AuthenticationFacade.refresh(
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
        AuthenticationFacade.refresh(
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
        AuthenticationFacade.refresh(
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
        AuthenticationFacade.refresh(
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
          ...authConfig,
          jwtSecret: randomString(64),
        },
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
      const accessTokenWithInvalidSignature = await newRefreshToken.sign(
        tokenPayloadsWithModifiedConfig,
      );

      await expect(
        AuthenticationFacade.refresh(
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
          ...authConfig,
          jwtIssuer: "John Doe <john.doe@gmail.com>",
        },
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
        AuthenticationFacade.refresh(
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
        AuthenticationFacade.refresh(
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
        AuthenticationFacade.refresh(
          signedNotStoredRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        ),
      ).rejects.toThrow("unknown refresh token");
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
        await AuthenticationFacade.refresh(
          spentRefreshToken,
          tokenPayloads,
          clock,
          authConfig,
          users,
          clients,
        );

      const decodedUsedRefreshToken =
        await tokenPayloads.decode(spentRefreshToken);
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
  describe("logoutClient", () => {});
});
