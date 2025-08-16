import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsObject, IsString } from "class-validator";

import { ScopeValue } from "@domain/authentication/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/authentication/OAuth/Scope/ScopeValueImmutableSet";
import { AppConfig } from "@infrastructure/config/configs/app.config";
import {
  configValidator,
  deepFreeze,
} from "@infrastructure/config/configs/utility";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";

export const openApiConfigDefaults = (port: number) => {
  return {
    exposed: false,
    path: "open-api",
    authorizationUrl: `http://localhost:${port}/oauth/authorize`,
    tokenUrl: `http://localhost:${port}/oauth/token`,
    refreshUrl: `http://localhost:${port}/oauth/token`,
    scopes: ScopeValueImmutableSet.fromArray([
      ScopeValue.PROFILE(),
      ScopeValue.TOKEN_REFRESH(),
      ScopeValue.TOKEN_REFRESH_ISSUE_LARGE_TTL(),
      ScopeValue.TOKEN_AUTHENTICATE(),
      ScopeValue.TASK_API(),
    ])
      .describe()
      .reduce(
        (carry, { name, description }) => {
          carry[name] = description;
          return carry;
        },
        {} as Record<string, string>,
      ),
  } satisfies OpenApiConfig;
};

@Injectable()
export class OpenApiConfig {
  @IsNotEmpty()
  @IsBoolean()
  exposed: boolean;

  @IsNotEmpty()
  @IsString()
  path: string;

  @IsNotEmpty()
  @IsString()
  authorizationUrl: string;

  @IsNotEmpty()
  @IsString()
  tokenUrl: string;

  @IsNotEmpty()
  @IsString()
  refreshUrl: string;

  @IsNotEmpty()
  @IsObject()
  scopes: Record<string, string>;

  public static provider(): Provider {
    return {
      provide: OpenApiConfig,
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
        appConfig: AppConfig,
      ) => {
        logger.setContext("OpenApiConfig factory");
        const config = plainToInstance<OpenApiConfig, Record<string, unknown>>(
          OpenApiConfig,
          {
            ...openApiConfigDefaults(appConfig.port),
            exposed: ["TRUE", "1"].includes(
              (
                nestConfigService.get<string>("OPENAPI_EXPOSED") || ""
              ).toLowerCase(),
            ),
          },
        );

        return deepFreeze(configValidator(config, logger));
      },
      inject: [ConfigService, LoggerInterfaceSymbol, AppConfig],
    };
  }
}
