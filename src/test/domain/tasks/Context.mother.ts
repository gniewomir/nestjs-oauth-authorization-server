import { assignedMother } from "@test/domain/tasks/Assigned.mother";

import { IdentityValue } from "@domain/IdentityValue";
import {
  Context,
  TContextConstructorParam,
} from "@domain/tasks/context/Context";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";

export const contextMother = (
  params: Partial<TContextConstructorParam> = {},
) => {
  return new Context({
    identity: IdentityValue.create(),
    description: DescriptionValue.fromString("example context"),
    orderKey: "Z",
    assigned: assignedMother().identity,
    ...params,
  });
};
