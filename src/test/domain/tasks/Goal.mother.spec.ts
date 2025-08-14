import { Goal } from "@domain/tasks/goal/Goal";

import { goalMother } from "./Goal.mother";

describe("Goal.mothers", () => {
  it("has working mother", () => {
    expect(goalMother()).toBeInstanceOf(Goal);
  });
});
