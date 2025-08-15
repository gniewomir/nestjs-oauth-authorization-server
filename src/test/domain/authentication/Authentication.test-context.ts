import { createAuthorizationTestContext } from "@test/domain/authentication/Authorization.test-context";
import { requestMother } from "@test/domain/authentication/Request.mother";
import { defaultTestClientScopesMother } from "@test/domain/authentication/ScopeValueImmutableSet.mother";

import { Assert } from "@domain/Assert";
import { AuthorizationFacade } from "@domain/authentication/Authorization.facade";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";

export const createAuthenticationTestContext = async (
  params: {
    requestedScopes?: ScopeValueImmutableSet;
  } = {},
) => {
  const requestedScopes = params.requestedScopes
    ? params.requestedScopes
    : defaultTestClientScopesMother();
  const authenticationContext = await createAuthorizationTestContext({
    clientScope: requestedScopes,
  });
  const {
    requests,
    requestId,
    users,
    userPassword,
    user,
    authConfig,
    passwords,
    codes,
    clock,
    clients,
    client,
    PKCE,
    tokenPayloads,
    codeChallenge,
    codeVerifier,
  } = authenticationContext;

  const request = await AuthorizationFacade.request(
    {
      ...requestMother(),
      clientId: client.id,
      id: requestId,
      codeChallenge,
      scope: requestedScopes,
    },
    requests,
    clients,
  );

  const { authorizationCode } = await AuthorizationFacade.prompt(
    {
      requestId,
      credentials: {
        email: user.email,
        rememberMe: false,
        password: PasswordValue.fromString(userPassword),
      },
    },
    requests,
    users,
    passwords,
    codes,
    clock,
    authConfig,
  );

  Assert(authorizationCode !== null);

  const { accessToken, refreshToken, idToken } =
    await AuthorizationFacade.codeExchange(
      {
        clientId: client.id,
        code: authorizationCode.toString(),
        codeVerifier,
        redirectUri: request.redirectUri,
      },
      requests,
      PKCE,
      clock,
      authConfig,
      users,
      tokenPayloads,
      clients,
    );

  return {
    ...authenticationContext,
    accessToken,
    refreshToken,
    idToken,
  };
};
