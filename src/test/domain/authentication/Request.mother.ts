import { IdentityValue } from "@domain/IdentityValue";
import {
  Request,
  TRequestConstructorParam,
} from "@domain/authentication/OAuth/Authorization/Request";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/User/Token/Scope/ScopeImmutableSet";
import { ScopeValue } from "@domain/authentication/OAuth/User/Token/Scope/ScopeValue";
import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { randomString } from "@test/randomString";

export const requestMother = (
  params: Partial<TRequestConstructorParam> = {},
) => {
  return new Request({
    id: IdentityValue.create(),
    clientId: IdentityValue.create(),
    redirectUri: HttpUrlValue.fromString("https://client-website.com/callback"),
    scope: ScopeImmutableSet.fromArray([ScopeValue.CUSTOMER_API()]),
    state: randomString(),
    codeChallenge: randomString(),
    authorizationCode: null,
    ...params,
  });
};
