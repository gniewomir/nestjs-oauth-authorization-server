import { IdentityValue } from "@domain/IdentityValue";
import { v4 } from "uuid";
import { DescriptionValue } from "@domain/tasks/DescriptionValue";
import {
  Context,
  TContextConstructorParam,
} from "@domain/tasks/context/Context";

export const contextMother = (
  params: Partial<TContextConstructorParam> = {},
) => {
  return new Context({
    identity: IdentityValue.fromString(v4()),
    description: DescriptionValue.fromString("example context"),
    ordinalNumber: Number.MAX_SAFE_INTEGER,
    ...params,
  });
};
