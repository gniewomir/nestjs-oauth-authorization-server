import { ScopeValue, ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope";

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
