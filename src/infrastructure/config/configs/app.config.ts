import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";

import { logLevels } from "@infrastructure/logger/logger.interface";

import { ConfigService } from "../config.service";

const acceptedEnvs = ["development", "test", "production"];

@Injectable()
export class AppConfig {
  @IsNotEmpty()
  @IsInt()
  port: number;

  @IsNotEmpty()
  @IsString()
  @IsIn(acceptedEnvs)
  nodeEnv: "production" | "development" | "test";

  @IsNotEmpty()
  @IsString()
  @IsIn(logLevels)
  logLevel: string;

  public static defaults(): AppConfig {
    return {
      port: 3000,
      nodeEnv: "production",
      logLevel: "warn",
    };
  }

  public static provider(): Provider {
    return {
      provide: AppConfig,
      useFactory: async (configService: ConfigService) => {
        return configService.provide({
          configName: "AppConfig",
          configCls: AppConfig,
          envVariablesPrefix: "app",
          options: {
            port: {
              allowDefault: true,
              description: "Port on which application will be running.",
            },
            logLevel: {
              allowDefault: true,
              description: `Lowest log level that will be logged.`,
              allowed: logLevels,
            },
            nodeEnv: {
              allowDefault: true,
              envVariableKey: "NODE_ENV",
              description:
                "Current application environment.\n" +
                '"development" & "test" are lenient when it comes to error reporting & configuration.\n' +
                '"production" limits error reporting outside logs and enforces stricter configuration.',
              allowed: acceptedEnvs,
            },
          },
          defaults: AppConfig.defaults(),
        });
      },
      inject: [ConfigService],
    };
  }
}
