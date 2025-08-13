import { Assert } from "@domain/Assert";

enum ScopeEnum {
  TASK_API = "task:api",
  ADMIN_API = "admin:api",
  TOKEN_AUTHENTICATE = "token:authenticate",
  TOKEN_REFRESH = "token:refresh",
  TOKEN_REFRESH_ISSUE_LARGE_TTL = "token:refresh:issue-large-ttl",
}

export class ScopeValue {
  private constructor(private readonly scope: ScopeEnum) {
    Assert(Object.values(ScopeEnum).includes(scope), `Unknown scope`);
  }

  public static TASK_API() {
    return ScopeValue.fromEnum(ScopeEnum.TASK_API);
  }

  public static ADMIN_API() {
    return ScopeValue.fromEnum(ScopeEnum.ADMIN_API);
  }

  public static TOKEN_AUTHENTICATE() {
    return ScopeValue.fromEnum(ScopeEnum.TOKEN_AUTHENTICATE);
  }

  public static TOKEN_REFRESH() {
    return ScopeValue.fromEnum(ScopeEnum.TOKEN_REFRESH);
  }

  public static TOKEN_REFRESH_ISSUE_LARGE_TTL() {
    return ScopeValue.fromEnum(ScopeEnum.TOKEN_REFRESH_ISSUE_LARGE_TTL);
  }

  public static fromEnum(scope: ScopeEnum): ScopeValue {
    return new ScopeValue(scope);
  }

  public static fromString(scope: string): ScopeValue {
    return new ScopeValue(scope as ScopeEnum);
  }

  public toString(): string {
    return this.scope.toString();
  }
}
