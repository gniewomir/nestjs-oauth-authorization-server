import { IdentityValue } from "@domain/IdentityValue";
import { v4 } from "uuid";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal } from "@domain/tasks/goal/Goal";

export const goalMother = () => {
  return new Goal(
    IdentityValue.fromString(v4()),
    DescriptionValue.fromString("example goal"),
  );
};
