import { randomString } from "@test/utility/randomString";

import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import {
  Request,
  TRequestConstructorParam,
} from "@domain/authentication/OAuth/Authorization/Request";
import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { IdentityValue } from "@domain/IdentityValue";

export const requestMother = (
  params: Partial<TRequestConstructorParam> = {},
) => {
  return new Request({
    id: IdentityValue.create(),
    clientId: IdentityValue.create(),
    redirectUri: HttpUrlValue.fromString("https://client-website.com/callback"),
    scope: ScopeValueImmutableSet.fromArray([ScopeValue.TASK_API()]),
    state: randomString(),
    codeChallenge: randomString(),
    authorizationCode: null,
    ...params,
  });
};
