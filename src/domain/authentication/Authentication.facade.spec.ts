import { createAuthenticationTestContext } from "@test/domain/authentication/Authentication.test-context";
import { accessTokenScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import { randomString } from "@test/utility/randomString";

import { AuthenticationFacade } from "@domain/authentication/Authentication.facade";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { AuthConfig } from "@infrastructure/config/configs";
import { plainToConfig } from "@infrastructure/config/utility";
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
          jwtKeyPath: "keys/theirs-key-es512",
        },
        authConfig,
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
          jwtIssuer: "John Doe <john.doe@gmail.com>",
        },
        authConfig,
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
});
