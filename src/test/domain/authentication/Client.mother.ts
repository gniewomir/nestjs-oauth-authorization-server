import {
  Client,
  TClientConstructorParam,
} from "@domain/authentication/OAuth/Client/Client";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";

export const clientMother = (params: Partial<TClientConstructorParam> = {}) => {
  return new Client({
    id: IdentityValue.create(),
    name: "web",
    scope: ScopeValueImmutableSet.fromArray([
      ScopeValue.PROFILE(),
      ScopeValue.TOKEN_AUTHENTICATE(),
      ScopeValue.TOKEN_REFRESH(),
      ScopeValue.TASK_API(),
    ]),
    ...params,
  });
};
