import { Task } from "@domain/tasks/task/Task";

import { taskMother } from "./Task.mother";

describe("Task.mothers", () => {
  it("has working mother", () => {
    expect(taskMother()).toBeInstanceOf(Task);
  });
});
