import { IdentityValue } from "@domain/IdentityValue";
import {
  Request,
  TRequestConstructorParam,
} from "@domain/authentication/OAuth/Authorization/Request";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Token/Scope/ScopeValueImmutableSet";
import { ScopeValue } from "@domain/authentication/OAuth/Token/Scope/ScopeValue";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { randomString } from "@test/randomString";

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
