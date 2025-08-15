import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";

export const defaultTestClientScopesMother = () => {
  return ScopeValueImmutableSet.fromArray([
    ScopeValue.PROFILE(),
    ScopeValue.TOKEN_AUTHENTICATE(),
    ScopeValue.TOKEN_REFRESH(),
    ScopeValue.TASK_API(),
  ]);
};

export const rememberMeTestClientScopesMother = () => {
  return ScopeValueImmutableSet.fromArray([
    ScopeValue.PROFILE(),
    ScopeValue.TOKEN_AUTHENTICATE(),
    ScopeValue.TOKEN_REFRESH(),
    ScopeValue.TOKEN_REFRESH_ISSUE_LARGE_TTL(),
    ScopeValue.TASK_API(),
  ]);
};

export const accessTokenScopesMother = () => {
  return defaultTestClientScopesMother().remove(ScopeValue.TOKEN_REFRESH());
};

export const refreshTokenScopesMother = () => {
  return defaultTestClientScopesMother().remove(
    ScopeValue.TOKEN_AUTHENTICATE(),
  );
};

export const rememberMeAccessTokenScopesMother = () => {
  return defaultTestClientScopesMother().remove(ScopeValue.TOKEN_REFRESH());
};

export const rememberMeRefreshTokenScopesMother = () => {
  return defaultTestClientScopesMother().remove(
    ScopeValue.TOKEN_AUTHENTICATE(),
  );
};
