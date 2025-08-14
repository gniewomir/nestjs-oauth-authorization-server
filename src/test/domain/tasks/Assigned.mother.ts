import { IdentityValue } from "@domain/IdentityValue";
import { Assigned } from "@domain/tasks/assigned/Assigned";

export const assignedMother = () => {
  return new Assigned(IdentityValue.create());
};
