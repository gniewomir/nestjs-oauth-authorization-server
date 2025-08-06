import { Task, TTaskConstructorParam } from "@domain/tasks/task/Task";
import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { goalMother } from "./Goal.mother";
import { contextMother } from "./Context.mother";
import { assignedMother } from "./Assigned.mother";

export const taskMother = (params: Partial<TTaskConstructorParam> = {}) => {
  return new Task({
    identity: IdentityValue.create(),
    assigned: assignedMother(),
    description: DescriptionValue.fromString("example task"),
    goal: goalMother(),
    context: contextMother(),
    ordinalNumber: Number.MAX_SAFE_INTEGER,
    ...params,
  });
};
