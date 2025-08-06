import { IdentityValue } from "@domain/IdentityValue";
import { v4 } from "uuid";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal, TGoalConstructorParam } from "@domain/tasks/goal/Goal";

export const goalMother = (params: Partial<TGoalConstructorParam> = {}) => {
  return new Goal({
    identity: IdentityValue.fromString(v4()),
    description: DescriptionValue.fromString("example goal"),
    ordinalNumber: Number.MAX_SAFE_INTEGER,
    ...params,
  });
};
