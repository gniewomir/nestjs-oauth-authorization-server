import { taskMother } from "./Task.mother";
import { Task } from "../../../domain/tasks/Task";
import { Assigned } from "../../../domain/tasks/assigned/Assigned";
import { Goal } from "../../../domain/tasks/goal/Goal";
import { Context } from "../../../domain/tasks/context/Context";

describe("Task.mothers", () => {
  it("has working mother", () => {
    expect(taskMother()).toBeInstanceOf(Task);
  });
  it("has assigned user", () => {
    expect(taskMother().assigned).toBeInstanceOf(Assigned);
  });
  it("has assigned goal", () => {
    expect(taskMother().goal).toBeInstanceOf(Goal);
  });
  it("has assigned context", () => {
    expect(taskMother().context).toBeInstanceOf(Context);
  });
});
