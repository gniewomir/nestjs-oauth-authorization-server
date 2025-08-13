import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";

describe("ScopeValue", () => {
  it("can be created from valid scope string", () => {
    expect(() => ScopeValue.TASK_API().toString()).not.toThrow();
  });
  it("can be created from valid enum value", () => {
    expect(() => ScopeValue.ADMIN_API()).not.toThrow();
  });
  it("prevents creation when string value is not a valid scope", () => {
    expect(() => ScopeValue.fromString("whatever")).toThrow("Unknown scope");
  });
  it("prevents creation when enum value is not a valid scope", () => {
    expect(() => ScopeValue.fromString("unknown")).toThrow("Unknown scope");
  });
});
