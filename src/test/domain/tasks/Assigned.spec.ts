import { Assigned } from "../../../domain/tasks/assigned/Assigned";
import { assignedMother } from "./Assigned.mother";

describe("Assigned.mothers", () => {
  it("has working mother", () => {
    expect(assignedMother()).toBeInstanceOf(Assigned);
  });
});
