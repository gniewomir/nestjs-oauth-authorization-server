import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import { randomString } from "@test/utility/randomString";

import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import {
  Request,
  TRequestConstructorParam,
} from "@domain/authentication/OAuth/Authorization/Request";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import { RedirectUriValue } from "@domain/authentication/OAuth/Client/RedirectUriValue";
import { IdentityValue } from "@domain/IdentityValue";

export const requestMother = (
  params: Partial<TRequestConstructorParam> = {},
) => {
  return new Request({
    id: IdentityValue.create(),
    responseType: ResponseTypeValue.TYPE_CODE(),
    clientId: IdentityValue.create(),
    redirectUri: RedirectUriValue.create(
      "https://client-website.com/callback",
      "test",
    ),
    scope: defaultTestClientScopesMother(),
    state: randomString(),
    codeChallenge: randomString(),
    codeChallengeMethod: CodeChallengeMethodValue.METHOD_S256(),
    authorizationCode: null,
    ...params,
  });
};
