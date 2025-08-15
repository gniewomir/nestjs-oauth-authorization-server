import { clientMother } from "@test/domain/authentication/Client.mother";
import { randomString } from "@test/utility/randomString";

import { HttpUrlValue } from "@domain/authentication/HttpUrlValue";
import { CodeChallengeMethodValue } from "@domain/authentication/OAuth/Authorization/PKCE/CodeChallengeMethodValue";
import {
  Request,
  TRequestConstructorParam,
} from "@domain/authentication/OAuth/Authorization/Request";
import { ResponseTypeValue } from "@domain/authentication/OAuth/Authorization/ResponseTypeValue";
import { IdentityValue } from "@domain/IdentityValue";

export const requestMother = (
  params: Partial<TRequestConstructorParam> = {},
) => {
  return new Request({
    id: IdentityValue.create(),
    responseType: ResponseTypeValue.TYPE_CODE(),
    clientId: IdentityValue.create(),
    redirectUri: HttpUrlValue.fromString("https://client-website.com/callback"),
    scope: clientMother().scope,
    state: randomString(),
    codeChallenge: randomString(),
    codeChallengeMethod: CodeChallengeMethodValue.METHOD_S256(),
    authorizationCode: null,
    ...params,
  });
};
