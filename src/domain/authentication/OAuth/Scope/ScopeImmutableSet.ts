import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";

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
