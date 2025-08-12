import { IdentityValue } from "@domain/IdentityValue";
import { v4 } from "uuid";
import {
  Client,
  TClientConstructorParam,
} from "@domain/authentication/OAuth/Client/Client";

export const clientMother = (params: Partial<TClientConstructorParam> = {}) => {
  return new Client({
    id: IdentityValue.fromString(v4()),
    name: "web",
    ...params,
  });
};
