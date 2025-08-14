import { IdentityValue } from "@domain/IdentityValue";
import {
  Assigned,
  TAssignedConstructorParam,
} from "@domain/tasks/assigned/Assigned";

export const assignedMother = (
  params: Partial<TAssignedConstructorParam> = {},
) => {
  return new Assigned({
    identity: IdentityValue.create(),
    ...params,
  });
};
