import { Assert } from "@domain/Assert";
import { OauthInvalidScopeException } from "@domain/authentication/OAuth/Errors/OauthInvalidScopeException";
import { OauthInvalidTokenException } from "@domain/authentication/OAuth/Errors/OauthInvalidTokenException";
import { OauthTokenExpiredException } from "@domain/authentication/OAuth/Errors/OauthTokenExpiredException";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { TokenPayload } from "@domain/authentication/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/authentication/OAuth/Token/TokenPayloads.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { AuthConfig } from "@infrastructure/config/configs";

export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadsInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    const payload = await tokenPayloads.verify(token);
    Assert(
      payload.hasValidIssuer(authConfig),
      () =>
        new OauthInvalidTokenException({ message: "jwt has invalid issuer" }),
    );
    Assert(
      payload.hasNotExpired(clock),
      () => new OauthTokenExpiredException({ message: "jwt expired" }),
    );
    Assert(
      payload.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      () =>
        new OauthInvalidScopeException({
          message: "jwt does not contain required scope",
        }),
    );
    return payload;
  }
}
