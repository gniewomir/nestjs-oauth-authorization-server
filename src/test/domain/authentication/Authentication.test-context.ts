import { createAuthorizationTestContext } from "@test/domain/authentication/Authorization.test-context";
import { requestMother } from "@test/domain/authentication/Request.mother";

import { AuthorizationFacade } from "@domain/authentication/Authorization.facade";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";

export const createAuthenticationTestContext = async ({
  requestedScopes,
}: {
  requestedScopes: ScopeValueImmutableSet;
}) => {
  const authenticationContext = await createAuthorizationTestContext();
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
