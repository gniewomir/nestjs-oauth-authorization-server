import { IdentityValue } from "@domain/IdentityValue";
import { v4 } from "uuid";
import { Assigned } from "@domain/tasks/assigned/Assigned";

export const assignedMother = () => {
  return new Assigned(IdentityValue.fromString(v4()));
};
