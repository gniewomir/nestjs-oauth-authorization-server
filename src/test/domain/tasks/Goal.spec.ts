import { goalMother } from "./Goal.mother";
import { Goal } from "../../../domain/tasks/goal/Goal";

describe("Goal.mothers", () => {
  it("has working mother", () => {
    expect(goalMother()).toBeInstanceOf(Goal);
  });
});
