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
    ordinalNumber: Number.MAX_SAFE_INTEGER,
    ...params,
  });
};
