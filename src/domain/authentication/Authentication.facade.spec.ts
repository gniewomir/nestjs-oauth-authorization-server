import { createAuthenticationContext } from "@test/domain/authentication/Authentication.context";
import { AuthenticationFacade } from "@domain/authentication/Authentication.facade";
import { randomString } from "@test/randomString";
import { plainToConfig } from "@infrastructure/config/configs/utility";
import { AuthConfig } from "@infrastructure/config/configs";
import { JwtServiceFake } from "@infrastructure/authentication/jwt";
import { TokenPayload } from "@domain/authentication/OAuth/User/Token/TokenPayload";
import { IdentityValue } from "@domain/IdentityValue";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeImmutableSet";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { NumericDateValue } from "@domain/authentication/OAuth/User/Token/NumericDateValue";

describe("AuthenticationFacade", () => {
  describe("authenticate", () => {
    it("accept valid access token", async () => {
      const { accessToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationContext();

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
        await createAuthenticationContext();

      await expect(
        AuthenticationFacade.authenticate(
          idToken,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects refresh token", async () => {
      const { refreshToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationContext();

      await expect(
        AuthenticationFacade.authenticate(
          refreshToken,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
    it("rejects expired access token", async () => {
      const { accessToken, tokenPayloads, clock, authConfig } =
        await createAuthenticationContext();

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
        await createAuthenticationContext();

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
      const { tokenPayloads, clock, authConfig, user } =
        await createAuthenticationContext();

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
      const newToken = new TokenPayload({
        iss: authConfig.jwtIssuer,
        iat: NumericDateValue.fromNumber(clock.nowAsSecondsSinceEpoch()),
        sub: user.identity,
        jti: IdentityValue.create(),
        exp: NumericDateValue.fromNumber(
          clock.nowAsSecondsSinceEpoch() +
            authConfig.jwtAccessTokenExpirationSeconds,
        ),
        scope: ScopeImmutableSet.fromArray([
          ScopeValue.TOKEN_AUTHENTICATE(),
          ScopeValue.CUSTOMER_API(),
        ]),
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
      const { tokenPayloads, clock, authConfig, user } =
        await createAuthenticationContext();

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
      const newToken = new TokenPayload({
        iss: modifiedAuthConfig.jwtIssuer,
        iat: NumericDateValue.fromNumber(clock.nowAsSecondsSinceEpoch()),
        sub: user.identity,
        jti: IdentityValue.create(),
        exp: NumericDateValue.fromNumber(
          clock.nowAsSecondsSinceEpoch() +
            authConfig.jwtAccessTokenExpirationSeconds,
        ),
        scope: ScopeImmutableSet.fromArray([
          ScopeValue.TOKEN_AUTHENTICATE(),
          ScopeValue.CUSTOMER_API(),
        ]),
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
      const { tokenPayloads, clock, authConfig, user } =
        await createAuthenticationContext();

      const newToken = new TokenPayload({
        iss: authConfig.jwtIssuer,
        iat: NumericDateValue.fromNumber(clock.nowAsSecondsSinceEpoch()),
        sub: user.identity,
        jti: IdentityValue.create(),
        exp: NumericDateValue.fromNumber(
          clock.nowAsSecondsSinceEpoch() +
            authConfig.jwtAccessTokenExpirationSeconds,
        ),
        scope: ScopeImmutableSet.fromArray([ScopeValue.CUSTOMER_API()]),
      });
      const invalidToken = await newToken.sign(tokenPayloads);

      await expect(
        AuthenticationFacade.authenticate(
          invalidToken,
          tokenPayloads,
          clock,
          authConfig,
        ),
      ).rejects.toThrow("jwt does not contain required scope");
    });
  });
  describe("refresh", () => {
    it("accepts valid refresh token", async () => {});
    it.todo("issues new idToken, accessToken and refresh token");
    it.todo(
      "issues longer ttl refresh token, if refresh token contained required scope",
    );
    it.todo("rejects idToken");
    it.todo("rejects access token");
    it.todo("rejects expired refresh token");
    it.todo("rejects garbled refresh token");
    it.todo("rejects refresh token signed with invalid secret/key");
    it.todo("rejects refresh token with invalid issuer");
    it.todo("rejects refresh token lacking required scope");
    it.todo("accepts only known refresh tokens");
    it.todo("removes used refresh token after use");
    it.todo("has only one valid refresh token at any time");
  });
  describe("logoutClient", () => {});
});
