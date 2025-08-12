import { ScopeValue } from "@domain/authentication/OAuth/User/Token/Scope/ScopeValue";
import { Assert } from "@domain/Assert";

export class ScopeImmutableSet {
  private readonly scopes: Set<string>;

  private constructor(scopes: (ScopeValue | string)[]) {
    this.scopes = new Set<string>(
      scopes.map((scope) =>
        typeof scope === "object" ? scope.toString() : scope.trim(),
      ),
    );
  }

  public static fromArray(scopes: (ScopeValue | string)[]): ScopeImmutableSet {
    return new ScopeImmutableSet(scopes);
  }

  public static fromString(scope: string): ScopeImmutableSet {
    return new ScopeImmutableSet(
      scope
        .split(" ")
        .map((scope) => scope.trim())
        .filter((scope) => scope.length > 0),
    );
  }

  public static fromUnknown(scope: unknown): ScopeImmutableSet {
    if (typeof scope === "string") {
      return ScopeImmutableSet.fromString(scope);
    }
    Assert(Array.isArray(scope), "scope is not an array");
    Assert(
      scope.every(
        (scope) =>
          typeof scope === "string" ||
          (typeof scope === "object" && scope instanceof ScopeValue),
      ),
      "scope is not an array of ScopeVale or strings",
    );
    return ScopeImmutableSet.fromArray(scope);
  }

  public toString(): string {
    return Array.from(this.scopes.values()).toSorted().join(" ");
  }

  public hasScope(testedScope: ScopeValue | string): boolean {
    return this.scopes.has(
      typeof testedScope === "object" ? testedScope.toString() : testedScope,
    );
  }

  public add(...args: (ScopeValue | string)[]): ScopeImmutableSet {
    return ScopeImmutableSet.fromArray([...this.scopes.values(), ...args]);
  }

  public remove(...args: (ScopeValue | string)[]): ScopeImmutableSet {
    const toRemove = new ScopeImmutableSet(args);
    return new ScopeImmutableSet(
      Array.from(this.scopes.values()).filter(
        (scope) => !toRemove.hasScope(scope),
      ),
    );
  }
}
