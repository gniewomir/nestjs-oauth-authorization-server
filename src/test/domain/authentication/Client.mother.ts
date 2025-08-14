import { IdentityValue } from "@domain/IdentityValue";
import {
  Client,
  TClientConstructorParam,
} from "@domain/authentication/OAuth/Client/Client";

export const clientMother = (params: Partial<TClientConstructorParam> = {}) => {
  return new Client({
    id: IdentityValue.create(),
    name: "web",
    ...params,
  });
};
