import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";

import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";

import { configValidator } from "./utility/configValidator";
import { deepFreeze } from "./utility/deepFreeze";

const normalizeEnv = (value: string | undefined) => {
  /**
   * When in doubt, be strict
   */
  if (!value) {
    return "production";
  }
  const normalized = value.toLowerCase().trim();
  if (["test", "testing"].includes(normalized)) {
    return "test";
  }
  if (["local", "dev", "development"].includes(normalized)) {
    return "development";
  }
  return "production";
};

@Injectable()
export class AppConfig {
  @IsNotEmpty()
  @IsInt()
  port: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(["development", "test", "production"])
  env: ReturnType<typeof normalizeEnv>;

  @IsNotEmpty()
  @IsString()
  @IsIn(["debug", "verbose", "info", "warn", "error"])
  loglevel: string;

  public static defaults(): AppConfig {
    return {
      port: 3000,
      env: "production",
      loglevel: "warn",
    };
  }

  public static provider(): Provider {
    return {
      provide: AppConfig,
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("AppConfig factory");
        const config = plainToInstance<AppConfig, Record<string, unknown>>(
          AppConfig,
          {
            ...AppConfig.defaults(),
            env: normalizeEnv(nestConfigService.get("NODE_ENV")),
            port: parseInt(nestConfigService.get("PORT") || "", 10),
            loglevel: nestConfigService.get("LOG_LEVEL") || "warn",
          },
        );

        return deepFreeze(configValidator(config, logger));
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
