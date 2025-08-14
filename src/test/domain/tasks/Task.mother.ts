import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Task, TTaskConstructorParam } from "@domain/tasks/task/Task";

import { assignedMother } from "./Assigned.mother";
import { contextMother } from "./Context.mother";
import { goalMother } from "./Goal.mother";

export const taskMother = (params: Partial<TTaskConstructorParam> = {}) => {
  return new Task({
    identity: IdentityValue.create(),
    assigned: assignedMother().identity,
    description: DescriptionValue.fromString("example task"),
    goal: goalMother(),
    context: contextMother(),
    orderKey: "Z",
    ...params,
  });
};
