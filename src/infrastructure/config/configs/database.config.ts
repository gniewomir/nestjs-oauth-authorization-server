import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { IsInt, IsNotEmpty, IsString } from "class-validator";

import { ConfigService } from "../config.service";

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
      useFactory: async (configService: ConfigService) => {
        return await configService.provide({
          configName: "DatabaseConfig",
          configCls: DatabaseConfig,
          envVariablesPrefix: "db",
          options: {
            port: {
              allowDefault: true,
              description: "Database port",
            },
            host: {
              allowDefault: true,
              description: "Database host",
            },
            database: {
              allowDefault: true,
              description: "Database name",
            },
            password: {
              allowDefault: true,
              description: "Database password",
            },
            user: {
              allowDefault: true,
              description: "Database user",
            },
          },
          defaults: DatabaseConfig.defaults(),
        });
      },
      inject: [ConfigService],
    };
  }
}
