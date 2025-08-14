import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";

import { configValidator } from "./utility/configValidator";
import { deepFreeze } from "./utility/deepFreeze";

@Injectable()
export class DatabaseConfig {
  @IsNotEmpty()
  @IsInt()
  port: number;

  @IsNotEmpty()
  @IsString()
  host: string;

  @IsNotEmpty()
  @IsString()
  user: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  database: string;

  public static provider(): Provider {
    return {
      provide: DatabaseConfig,
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("DatabaseConfig factory");
        const config = plainToInstance<DatabaseConfig, Record<string, unknown>>(
          DatabaseConfig,
          {
            port: parseInt(nestConfigService.get("DATABASE_PORT") || "", 10),
            host: nestConfigService.get("DATABASE_HOST") || "",
            user: nestConfigService.get("DATABASE_USER") || "",
            password: nestConfigService.get("DATABASE_PASSWORD") || "",
            database: nestConfigService.get("DATABASE_NAME") || "",
          },
        );

        return deepFreeze(configValidator(config, logger));
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
