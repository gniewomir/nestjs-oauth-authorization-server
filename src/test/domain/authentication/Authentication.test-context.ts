import { createAuthorizationTestContext } from "@test/domain/authentication/Authorization.test-context";
import { AuthorizationFacade } from "@domain/authentication/Authorization.facade";
import { ScopeImmutableSet } from "@domain/authentication/OAuth/User/Token/Scope/ScopeImmutableSet";
import { requestMother } from "@test/domain/authentication/Request.mother";
import { PasswordValue } from "@domain/authentication/OAuth/User/Credentials/PasswordValue";

export const createAuthenticationTestContext = async ({
  requestedScopes,
}: {
  requestedScopes: ScopeImmutableSet;
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

  const request = await AuthorizationFacade.authorizationRequest(
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

  const { authorizationCode } = await AuthorizationFacade.authorizationPrompt(
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
    await AuthorizationFacade.authorizationCodeExchange(
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
    );

  return {
    ...authenticationContext,
    accessToken,
    refreshToken,
    idToken,
  };
};
