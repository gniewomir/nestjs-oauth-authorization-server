import { Assert } from "@domain/Assert";
import {
  OauthInvalidScopeException,
  OauthServerErrorException,
} from "@domain/auth/OAuth/Errors";
import { deepFreeze } from "@infrastructure/config/utility";

type TScopeDescription = {
  name: string;
  humanName: string;
  description: string;
};

enum ScopeEnum {
  PROFILE = "profile",
  TASK_API = "task:api",
  ADMIN_API = "admin:api",
  TOKEN_AUTHENTICATE = "token:authenticate",
  TOKEN_REFRESH = "token:refresh",
  TOKEN_REFRESH_ISSUE_LARGE_TTL = "token:refresh:issue-large-ttl",
}

type TScopeDescriptions = Readonly<
  Record<keyof typeof ScopeEnum, Readonly<TScopeDescription>>
>;

const descriptions: TScopeDescriptions = deepFreeze({
  PROFILE: {
    name: ScopeEnum.PROFILE.toString(),
    humanName: "User profile",
    description: "Allows the application to access your profile",
  },
  ADMIN_API: {
    name: ScopeEnum.ADMIN_API.toString(),
    humanName: "Administrative Access",
    description: "Provides administrative capabilities and system-wide access",
  },
  TASK_API: {
    name: ScopeEnum.TASK_API.toString(),
    humanName: "Tasks API Access",
    description: "Allows the application to manage your tasks",
  },
  TOKEN_AUTHENTICATE: {
    name: ScopeEnum.TOKEN_AUTHENTICATE.toString(),
    humanName: "Token Authentication",
    description: "Allows the application to authenticate using tokens",
  },
  TOKEN_REFRESH: {
    name: ScopeEnum.TOKEN_REFRESH.toString(),
    humanName: "Token Refresh",
    description: "Allows the application to refresh access tokens",
  },
  TOKEN_REFRESH_ISSUE_LARGE_TTL: {
    name: ScopeEnum.TOKEN_REFRESH_ISSUE_LARGE_TTL.toString(),
    humanName: "Extended Refresh Token Lifetime",
    description: "Allows application to keep you logged in",
  },
}) satisfies TScopeDescriptions;

export class ScopeValue {
  private constructor(private readonly scope: ScopeEnum) {
    Assert(
      Object.values(ScopeEnum).includes(scope),
      () => new OauthInvalidScopeException({ message: `Unknown scope` }),
    );
  }

  public static PROFILE() {
    return ScopeValue.fromEnum(ScopeEnum.PROFILE);
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

  public describe() {
    for (const description of Object.values(descriptions)) {
      if (description.name === this.scope.toString()) {
        return description;
      }
    }
    throw new OauthServerErrorException({
      message: "Could not describe scope",
    });
  }
}
