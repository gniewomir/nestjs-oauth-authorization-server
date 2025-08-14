import { assignedMother } from "@test/domain/tasks/Assigned.mother";

import { IdentityValue } from "@domain/IdentityValue";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import { Goal, TGoalConstructorParam } from "@domain/tasks/goal/Goal";

export const goalMother = (params: Partial<TGoalConstructorParam> = {}) => {
  return new Goal({
    identity: IdentityValue.create(),
    description: DescriptionValue.fromString("example goal"),
    orderKey: "Z",
    assigned: assignedMother().identity,
    ...params,
  });
};
