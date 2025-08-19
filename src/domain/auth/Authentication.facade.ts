import { Assert } from "@domain/Assert";
import {
  OauthInvalidScopeException,
  OauthInvalidTokenException,
  OauthTokenExpiredException,
} from "@domain/auth/OAuth/Errors";
import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { TokenPayload } from "@domain/auth/OAuth/Token/TokenPayload";
import { TokenPayloadsInterface } from "@domain/auth/OAuth/Token/TokenPayloads.interface";
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
        new OauthInvalidTokenException({
          message: "jwt has invalid issuer",
        }),
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
