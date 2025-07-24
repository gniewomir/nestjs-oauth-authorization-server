import { IdentityValue } from "../../../domain/IdentityValue";
import { v4 } from "uuid";
import { DescriptionValue } from "../../../domain/tasks/DescriptionValue";
import { Context } from "../../../domain/tasks/context/Context";

export const contextMother = () => {
  return new Context(
    IdentityValue.fromString(v4()),
    DescriptionValue.fromString("example context"),
  );
};
