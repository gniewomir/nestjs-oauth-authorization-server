import { taskMother } from "./Task.mother";
import { Task } from "@domain/tasks/Task";

describe("Task.mothers", () => {
  it("has working mother", () => {
    expect(taskMother()).toBeInstanceOf(Task);
  });
});
