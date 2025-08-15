import { Assert } from "@domain/Assert";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";

export type TClientConstructorArgs = ConstructorParameters<typeof Client>;
export type TClientConstructorParam = TClientConstructorArgs[0];

export class Client {
  public readonly id: IdentityValue;
  public readonly name: string;
  public readonly scope: ScopeValueImmutableSet;

  constructor(params: {
    id: IdentityValue;
    name: string;
    scope: ScopeValueImmutableSet;
  }) {
    Assert(
      params.scope.hasScope(ScopeValue.TOKEN_AUTHENTICATE()),
      "Client have to be able to at least authenticate!",
    );
    this.id = params.id;
    this.name = params.name;
    this.scope = params.scope;
  }
}
