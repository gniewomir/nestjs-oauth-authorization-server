import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";

import { configValidator } from "./utility/configValidator";
import { deepFreeze } from "./utility/deepFreeze";

@Injectable()
export class AppConfig {
  @IsNotEmpty()
  @IsInt()
  port: number;

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
            port: parseInt(nestConfigService.get("APP_PORT") || "", 10),
          },
        );

        return deepFreeze(configValidator(config, logger));
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
