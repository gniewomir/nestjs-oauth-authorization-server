import { contextMother } from "./Context.mother";
import { Context } from "@domain/tasks/context/Context";

describe("Context.mothers", () => {
  it("has working mother", () => {
    expect(contextMother()).toBeInstanceOf(Context);
  });
});
