import { Assert } from "@domain/Assert";
import { RedirectUriValue } from "@domain/authentication/OAuth/Client/RedirectUriValue";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";

export type TClientConstructorArgs = ConstructorParameters<typeof Client>;
export type TClientConstructorParam = TClientConstructorArgs[0];

export class Client {
  public readonly id: IdentityValue;
  public readonly name: string;
  public readonly scope: ScopeValueImmutableSet;
  public readonly redirectUri: RedirectUriValue;

  constructor(params: {
    id: IdentityValue;
    name: string;
    scope: ScopeValueImmutableSet;
    redirectUri: RedirectUriValue;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.scope = params.scope;
    this.redirectUri = params.redirectUri;
  }

  public static create(params: TClientConstructorParam): Client {
    Assert(
      params.scope.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      "Client have to be able to at least authenticate!",
    );
    Assert(
      params.name.length <= 128,
      "Client name is too long - max 128 characters",
    );
    return new Client(params);
  }
}
