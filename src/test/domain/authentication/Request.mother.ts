import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";
import { randomString } from "@test/utility/randomString";

import { CodeChallengeMethodValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import { CodeChallengeValue } from "@domain/auth/OAuth/Authorization/PKCE/CodeChallengeValue";
import {
  Request,
  TRequestConstructorParam,
} from "@domain/auth/OAuth/Authorization/Request";
import { ResolutionValue } from "@domain/auth/OAuth/Authorization/ResolutionValue";
import { ResponseTypeValue } from "@domain/auth/OAuth/Authorization/ResponseTypeValue";
import { StateValue } from "@domain/auth/OAuth/Authorization/StateValue";
import { RedirectUriValue } from "@domain/auth/OAuth/Client/RedirectUriValue";
import { IdentityValue } from "@domain/IdentityValue";

export const requestMother = (
  params: Partial<TRequestConstructorParam> = {},
) => {
  return new Request({
    id: IdentityValue.create(),
    responseType: ResponseTypeValue.TYPE_CODE(),
    clientId: IdentityValue.create(),
    redirectUri: RedirectUriValue.create("https://web.com/callback", "test"),
    scope: defaultTestClientScopesMother(),
    state: StateValue.fromString(randomString()),
    codeChallenge: CodeChallengeValue.fromString(randomString(43)),
    codeChallengeMethod: CodeChallengeMethodValue.METHOD_S256(),
    authorizationCode: null,
    intent: null,
    resolution: ResolutionValue.PENDING(),
    ...params,
  });
};
