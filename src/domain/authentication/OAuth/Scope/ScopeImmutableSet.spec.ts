import { ScopeImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeImmutableSet";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";

describe("ScopeImmutableSet", () => {
  it("can be created from string", () => {
    const scopesAsString = "token:authenticate customer:api";
    const scopesStringArray = scopesAsString.split(" ");
    const sut = ScopeImmutableSet.fromString(scopesAsString);
    expect(sut.hasScope(scopesStringArray[0])).toEqual(true);
    expect(sut.hasScope(scopesStringArray[1])).toEqual(true);
  });
  it("can be created from array of strings", () => {
    const scopesAsString = "token:authenticate customer:api";
    const scopesStringArray = scopesAsString.split(" ");
    const sut = ScopeImmutableSet.fromArray(scopesStringArray);
    expect(sut.hasScope(scopesStringArray[0])).toEqual(true);
    expect(sut.hasScope(scopesStringArray[1])).toEqual(true);
  });
  it("can be created from array of values", () => {
    const scopesAsString = "token:authenticate customer:api";
    const scopesStringArray = scopesAsString.split(" ");
    const scopesAsValues = scopesStringArray.map((value) =>
      ScopeValue.fromString(value),
    );
    const sut = ScopeImmutableSet.fromArray(scopesAsValues);
    expect(sut.hasScope(scopesStringArray[0])).toEqual(true);
    expect(sut.hasScope(scopesStringArray[1])).toEqual(true);
  });
  describe("is immutable", () => {
    it("adding scopes return new object", () => {
      const scopesAsString = "token:authenticate customer:api";
      const scopesStringArray = scopesAsString.split(" ");
      const sut = ScopeImmutableSet.fromString(scopesAsString);
      const addedScope = "admin:api";
      const newSut = sut.add(addedScope);
      expect(sut.hasScope(addedScope)).toEqual(false);
      expect(newSut.hasScope(scopesStringArray[0])).toEqual(true);
      expect(newSut.hasScope(scopesStringArray[1])).toEqual(true);
      expect(newSut.hasScope(addedScope)).toEqual(true);
      expect(newSut).not.toBe(sut);
    });
    it("removing scopes return new object", () => {
      const scopesAsString = "token:authenticate customer:api admin:api";
      const scopesStringArray = scopesAsString.split(" ");
      const sut = ScopeImmutableSet.fromString(scopesAsString);
      const removedScope = "admin:api";
      const newSut = sut.remove(removedScope);
      expect(sut.hasScope(removedScope)).toEqual(true);
      expect(newSut.hasScope(scopesStringArray[0])).toEqual(true);
      expect(newSut.hasScope(scopesStringArray[1])).toEqual(true);
      expect(newSut.hasScope(removedScope)).toEqual(false);
      expect(newSut).not.toBe(sut);
    });
  });
  it("represented as string it will be sorted alphabetically", () => {
    const scopesAsString = "token:authenticate customer:api";
    const sortedScopesAsString = "customer:api token:authenticate";
    const sut = ScopeImmutableSet.fromString(scopesAsString);
    expect(sut.toString()).toEqual(sortedScopesAsString);
  });
});
