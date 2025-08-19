import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

import { ScopeValue } from "@domain/auth/OAuth/Scope/ScopeValue";
import { ScopeValueImmutableSet } from "@domain/auth/OAuth/Scope/ScopeValueImmutableSet";

import { ConfigService } from "../config.service";

import { AppConfig } from "./app.config";

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
  @IsString()
  scopes: string;

  public static defaults({ port }: { port: number }): OpenApiConfig {
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
      ]).toString(),
    } satisfies OpenApiConfig;
  }

  public static provider(): Provider {
    return {
      provide: OpenApiConfig,
      useFactory: async (
        configService: ConfigService,
        appConfig: AppConfig,
      ) => {
        return await configService.provide({
          configName: "OpenApiConfig",
          configCls: OpenApiConfig,
          envVariablesPrefix: "openapi",
          options: {
            exposed: {
              allowDefault: true,
              description: "Should API docs should be exposed to the world?",
            },
          },
          defaults: OpenApiConfig.defaults({ port: appConfig.port }),
        });
      },
      inject: [ConfigService, AppConfig],
    };
  }
}
