import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";

import {
  Client,
  TClientConstructorParam,
} from "@domain/authentication/OAuth/Client/Client";
import { RedirectUriValue } from "@domain/authentication/OAuth/RedirectUriValue";
import { IdentityValue } from "@domain/IdentityValue";

export const clientMother = (params: Partial<TClientConstructorParam> = {}) => {
  return new Client({
    id: IdentityValue.create(),
    name: "web",
    scope: defaultTestClientScopesMother(),
    redirectUri: RedirectUriValue.create("https://web.com/callback", "test"),
    ...params,
  });
};
