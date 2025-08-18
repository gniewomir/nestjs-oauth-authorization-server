import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

import { provide } from "@infrastructure/config/utility/provide";

import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";

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

  public static defaults(): DatabaseConfig {
    return {
      host: "localhost",
      port: 5432,
      user: "test",
      password: "test",
      database: "test",
    };
  }

  public static provider(): Provider {
    return {
      provide: DatabaseConfig,
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("DatabaseConfig factory");
        return await provide(
          "db",
          "DatabaseConfig",
          DatabaseConfig,
          logger,
          nestConfigService,
          {
            port: {
              fromEnv: "required",
              description: "Database port",
            },
            host: {
              fromEnv: "required",
              description: "Database host",
            },
            database: {
              fromEnv: "required",
              description: "Database name",
            },
            password: {
              fromEnv: "required",
              description: "Database password",
            },
            user: {
              fromEnv: "required",
              description: "Database user",
            },
          },
          DatabaseConfig.defaults(),
        );
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
