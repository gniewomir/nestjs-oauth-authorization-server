import { Assert } from "@domain/Assert";
import { RedirectUriValue } from "@domain/auth/OAuth/Client/RedirectUriValue";
import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";

export type TClientConstructorArgs = ConstructorParameters<typeof Client>;
export type TClientConstructorParam = TClientConstructorArgs[0];

export class Client {
  public readonly id: IdentityValue;
  public readonly name: string;
  public readonly scope: ScopeValueImmutableSet;
  public readonly redirectUri: RedirectUriValue;
  public readonly registration: boolean;

  constructor(params: {
    id: IdentityValue;
    name: string;
    scope: ScopeValueImmutableSet;
    redirectUri: RedirectUriValue;
    registration: boolean;
  }) {
    this.id = params.id;
    this.name = params.name;
    this.scope = params.scope;
    this.redirectUri = params.redirectUri;
    this.registration = params.registration;
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

  public allowsRegistration(): boolean {
    return this.registration;
  }
}
