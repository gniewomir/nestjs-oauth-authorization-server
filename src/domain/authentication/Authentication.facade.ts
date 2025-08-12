import { AuthConfig } from "@infrastructure/config/configs";
import { TokenPayloadInterface } from "./OAuth/User/Token/TokenPayload.interface";
import { ClockInterface } from "@domain/Clock.interface";
import { TokenPayload } from "@domain/authentication/OAuth/User/Token/TokenPayload";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { Assert } from "@domain/Assert";

export class AuthenticationFacade {
  public static async authenticate(
    token: string,
    tokenPayloads: TokenPayloadInterface,
    clock: ClockInterface,
    authConfig: AuthConfig,
  ): Promise<TokenPayload> {
    const payload = await tokenPayloads.verify(token);
    Assert(payload.hasValidIssuer(authConfig), "jwt has invalid issuer");
    Assert(payload.hasNotExpired(clock), "jwt expired");
    Assert(
      payload.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      "jwt does not contain required scope",
    );
    return payload;
  }

  public static refresh() {
    throw new Error("Not implemented");
  }

  public static logoutClient() {
    throw new Error("Not implemented");
  }
}
