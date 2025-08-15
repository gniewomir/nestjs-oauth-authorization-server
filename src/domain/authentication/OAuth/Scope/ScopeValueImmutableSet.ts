import { Assert } from "@domain/Assert";
import { OauthInvalidScopeException } from "@domain/authentication/OAuth/Errors/OauthInvalidScopeException";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";

export class ScopeValueImmutableSet implements Iterable<ScopeValue> {
  *[Symbol.iterator](): IterableIterator<ScopeValue> {
    for (const scope of this.scopes.values()) {
      yield ScopeValue.fromString(scope);
    }
  }

  private readonly scopes: Set<string>;

  private constructor(scopes: (ScopeValue | string)[]) {
    this.scopes = new Set<string>(
      scopes
        .map((scope) =>
          typeof scope === "object" ? scope.toString() : scope.trim(),
        )
        .toSorted(),
    );
  }

  public static fromArray(
    scopes: (ScopeValue | string)[],
  ): ScopeValueImmutableSet {
    return new ScopeValueImmutableSet(scopes);
  }

  public static fromString(scope: string): ScopeValueImmutableSet {
    return new ScopeValueImmutableSet(
      scope
        .split(" ")
        .map((scope) => scope.trim())
        .filter((scope) => scope.length > 0),
    );
  }

  public static fromUnknown(scope: unknown): ScopeValueImmutableSet {
    if (typeof scope === "string") {
      return ScopeValueImmutableSet.fromString(scope);
    }
    Assert(
      Array.isArray(scope),
      () =>
        new OauthInvalidScopeException({ message: "scope is not an array" }),
    );
    Assert(
      scope.every(
        (scope) => typeof scope === "string" || scope instanceof ScopeValue,
      ),
      () =>
        new OauthInvalidScopeException({
          message: "scope is not an array of ScopeVale or strings",
        }),
    );
    return ScopeValueImmutableSet.fromArray(scope);
  }

  public toString(): string {
    return Array.from(this.scopes.values()).toSorted().join(" ");
  }

  public hasScope(testedScope: ScopeValue | string): boolean {
    return this.scopes.has(
      typeof testedScope === "object" ? testedScope.toString() : testedScope,
    );
  }

  public add(...args: (ScopeValue | string)[]): ScopeValueImmutableSet {
    return ScopeValueImmutableSet.fromArray([...this.scopes.values(), ...args]);
  }

  public remove(...args: (ScopeValue | string)[]): ScopeValueImmutableSet {
    const toRemove = new ScopeValueImmutableSet(args);
    return new ScopeValueImmutableSet(
      Array.from(this.scopes.values()).filter(
        (scope) => !toRemove.hasScope(scope),
      ),
    );
  }

  public isSupersetOf(scopeSet: ScopeValueImmutableSet): boolean {
    return Array.from(scopeSet).every((scope) =>
      this.scopes.has(scope.toString()),
    );
  }
}
