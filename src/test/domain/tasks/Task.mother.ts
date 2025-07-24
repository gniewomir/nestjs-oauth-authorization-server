import { Task } from "@domain/tasks/Task";
import { IdentityValue } from "@domain/IdentityValue";
import { v4 } from "uuid";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { goalMother } from "./Goal.mother";
import { contextMother } from "./Context.mother";
import { assignedMother } from "./Assigned.mother";

export const taskMother = () => {
  return new Task(
    IdentityValue.fromString(v4()),
    DescriptionValue.fromString("example task"),
    assignedMother(),
    goalMother(),
    contextMother(),
  );
};
