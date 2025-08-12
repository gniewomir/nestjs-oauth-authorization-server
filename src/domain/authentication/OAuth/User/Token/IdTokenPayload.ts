import { IdentityValue } from "@domain/IdentityValue";
import { TokenPayloadInterface } from "@domain/authentication/OAuth/User/Token/TokenPayload.interface";
import { EmailValue } from "@domain/authentication/OAuth/Credentials/EmailValue";
import { Assert } from "@domain/Assert";

export type TIdTokenPayloadConstructorArgs = ConstructorParameters<
  typeof IdTokenPayload
>;
export type TIdTokenPayloadParams = TIdTokenPayloadConstructorArgs[0];

export class IdTokenPayload {
  public readonly jti: string;
  public readonly iss: string;
  public readonly sub: string;
  public readonly exp: number;
  public readonly iat: number;
  public readonly email: string;
  public readonly email_verified: boolean;

  constructor(payload: {
    jti: IdentityValue;
    iss: string;
    sub: IdentityValue;
    exp: number;
    iat: number;
    email: EmailValue;
    email_verified: boolean;
  }) {
    this.iss = payload.iss;
    this.iat = payload.iat;
    this.exp = payload.exp;
    this.sub = payload.sub.toString();
    this.jti = payload.jti.toString();
    this.email = payload.email.toString();
    this.email_verified = payload.email_verified;
  }

  public static fromUnknown(payload: Record<string, unknown>) {
    Assert(typeof payload.jti === "string", "Claim jti must be a string");
    Assert(typeof payload.sub === "string", "Claim sub must be a string");
    Assert(typeof payload.iss === "string", "Claim iss must be a string");
    Assert(
      typeof payload.iat === "number" && payload.iat > 0,
      "Claim iat must be a timestamp",
    );
    Assert(
      typeof payload.exp === "number" && payload.exp > 0,
      "Claim exp must be a timestamp",
    );
    Assert(
      payload.exp > payload.iat,
      "JWT expiration cannot be before issuing",
    );
    Assert(typeof payload.email === "string", "email must be a string");
    Assert(
      typeof payload.email_verified === "boolean",
      "email_verified must be a boolean",
    );

    return new IdTokenPayload({
      iss: payload.iss,
      exp: payload.exp,
      iat: payload.iat,
      jti: IdentityValue.fromString(payload.jti),
      sub: IdentityValue.fromString(payload.sub),
      email: EmailValue.fromString(payload.email),
      email_verified: payload.email_verified,
    });
  }

  public async sign(tokenInterface: TokenPayloadInterface): Promise<string> {
    return await tokenInterface.sign(Object.fromEntries(Object.entries(this)));
  }
}
