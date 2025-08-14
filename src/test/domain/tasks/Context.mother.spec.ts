import { Context } from "@domain/tasks/context/Context";

import { contextMother } from "./Context.mother";

describe("Context.mothers", () => {
  it("has working mother", () => {
    expect(contextMother()).toBeInstanceOf(Context);
  });
});
