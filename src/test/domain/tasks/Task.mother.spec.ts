import { taskMother } from "./Task.mother";
import { Task } from "@domain/tasks/task/Task";

describe("Task.mothers", () => {
  it("has working mother", () => {
    expect(taskMother()).toBeInstanceOf(Task);
  });
});
