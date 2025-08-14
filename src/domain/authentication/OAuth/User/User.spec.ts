import { userMother } from "@test/domain/authentication";

import { RefreshTokenValue } from "@domain/authentication/OAuth/User/RefreshTokenValue";
import { IdentityValue } from "@domain/IdentityValue";
import { ClockServiceFake } from "@infrastructure/clock/clock.service.fake";

describe("User", () => {
  describe("rotateTokens", () => {
    it("removes expired tokens", () => {
      const clock = new ClockServiceFake();
      const now = clock.nowAsSecondsSinceEpoch();
      const MINUTE_IN_SECONDS = 60;
      const expiredRefreshToken = RefreshTokenValue.fromUnknown({
        aud: IdentityValue.create(),
        exp: now - MINUTE_IN_SECONDS,
        jti: IdentityValue.create(),
      });
      const freshRefreshToken = RefreshTokenValue.fromUnknown({
        aud: IdentityValue.create(),
        exp: now + MINUTE_IN_SECONDS,
        jti: IdentityValue.create(),
      });
      const sut = userMother({
        refreshTokens: [expiredRefreshToken],
      });
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch());

      sut.rotateRefreshToken(freshRefreshToken, clock);

      expect(sut.refreshTokens).toEqual([freshRefreshToken]);
    });
    it("replaces existing refresh token for client", () => {
      const clock = new ClockServiceFake();
      const now = clock.nowAsSecondsSinceEpoch();
      const MINUTE_IN_SECONDS = 60;
      const clientId = IdentityValue.create();
      const oldRefreshToken = RefreshTokenValue.fromUnknown({
        aud: clientId,
        exp: now + MINUTE_IN_SECONDS,
        jti: IdentityValue.create(),
      });
      const newRefreshToken = RefreshTokenValue.fromUnknown({
        aud: clientId,
        exp: now + MINUTE_IN_SECONDS,
        jti: IdentityValue.create(),
      });
      const sut = userMother({
        refreshTokens: [oldRefreshToken],
      });
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch());

      sut.rotateRefreshToken(newRefreshToken, clock);

      expect(sut.refreshTokens).toEqual([newRefreshToken]);
    });
    it("does not store superfluous properties", () => {
      const clock = new ClockServiceFake();
      const now = clock.nowAsSecondsSinceEpoch();
      const MINUTE_IN_SECONDS = 60;
      const clientId = IdentityValue.create();
      const oldRefreshToken = RefreshTokenValue.fromUnknown({
        aud: clientId,
        exp: now + MINUTE_IN_SECONDS,
        jti: IdentityValue.create(),
      });
      const newRefreshTokenId = IdentityValue.create();
      const newRefreshToken = {
        aud: clientId.toString(),
        exp: now + MINUTE_IN_SECONDS,
        jti: newRefreshTokenId.toString(),
        superfluous: true,
      };
      const sut = userMother({
        refreshTokens: [oldRefreshToken],
      });
      clock.timeTravelSeconds(clock.nowAsSecondsSinceEpoch());

      sut.rotateRefreshToken(newRefreshToken, clock);

      expect(sut.refreshTokens).toEqual([
        {
          aud: clientId.toString(),
          exp: now + MINUTE_IN_SECONDS,
          jti: newRefreshTokenId.toString(),
        },
      ]);
    });
  });
});
