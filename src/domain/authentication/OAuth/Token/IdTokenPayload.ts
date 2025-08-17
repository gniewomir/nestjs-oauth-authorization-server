import { Assert } from "@domain/Assert";
import { Client } from "@domain/authentication/OAuth/Client/Client";
import { OauthInvalidRequestException } from "@domain/authentication/OAuth/Errors/OauthInvalidRequestException";
import { NumericDateValue } from "@domain/authentication/OAuth/NumericDateValue";
import { TokenPayloadsInterface } from "@domain/authentication/OAuth/Token/TokenPayloads.interface";
import { EmailValue } from "@domain/authentication/OAuth/User/Credentials/EmailValue";
import { User } from "@domain/authentication/OAuth/User/User";
import { ClockInterface } from "@domain/Clock.interface";
import { IdentityValue } from "@domain/IdentityValue";
import { AuthConfig } from "@infrastructure/config/configs";

export type TIdTokenPayloadConstructorArgs = ConstructorParameters<
  typeof IdTokenPayload
>;
export type TIdTokenPayloadParams = TIdTokenPayloadConstructorArgs[0];

export class IdTokenPayload {
  public readonly aud: string;
  public readonly jti: string;
  public readonly iss: string;
  public readonly sub: string;
  public readonly exp: number;
  public readonly iat: number;
  public readonly email: string;
  public readonly email_verified: boolean;

  constructor(payload: {
    aud: IdentityValue;
    jti: IdentityValue;
    iss: string;
    sub: IdentityValue;
    exp: NumericDateValue;
    iat: NumericDateValue;
    email: EmailValue;
    email_verified: boolean;
  }) {
    this.aud = payload.aud.toString();
    this.iss = payload.iss;
    this.iat = payload.iat.toNumber();
    this.exp = payload.exp.toNumber();
    this.sub = payload.sub.toString();
    this.jti = payload.jti.toString();
    this.email = payload.email.toString();
    this.email_verified = payload.email_verified;
  }

  public static createIdToken({
    authConfig,
    user,
    clock,
    client,
  }: {
    authConfig: AuthConfig;
    user: User;
    clock: ClockInterface;
    client: Client;
  }) {
    const now = clock.nowAsSecondsSinceEpoch();
    return new IdTokenPayload({
      aud: client.id,
      jti: IdentityValue.create(),
      iss: authConfig.jwtIssuer,
      sub: user.identity,
      iat: NumericDateValue.fromNumber(now),
      exp: NumericDateValue.fromNumber(
        now + authConfig.jwtAccessTokenExpirationSeconds,
      ),
      email: user.email,
      email_verified: user.emailVerified,
    });
  }

  public static fromUnknown(payload: Record<string, unknown>) {
    Assert(
      typeof payload.iss === "string",
      () =>
        new OauthInvalidRequestException({
          developerMessage: "Claim iss must be a string",
        }),
    );
    const exp = NumericDateValue.fromUnknown(payload.exp);
    const iat = NumericDateValue.fromUnknown(payload.iat);
    Assert(
      exp.toNumber() > iat.toNumber(),
      () =>
        new OauthInvalidRequestException({
          developerMessage: "jwt cannot expire before it was issued",
        }),
    );
    Assert(
      typeof payload.email_verified === "boolean",
      () =>
        new OauthInvalidRequestException({
          developerMessage: "email_verified must be a boolean",
        }),
    );

    return new IdTokenPayload({
      aud: IdentityValue.fromUnknown(payload.aud),
      iss: payload.iss,
      exp,
      iat,
      jti: IdentityValue.fromUnknown(payload.jti),
      sub: IdentityValue.fromUnknown(payload.sub),
      email: EmailValue.fromUnknown(payload.email),
      email_verified: payload.email_verified,
    });
  }

  public async sign(tokenInterface: TokenPayloadsInterface): Promise<string> {
    return await tokenInterface.sign(Object.fromEntries(Object.entries(this)));
  }
}
