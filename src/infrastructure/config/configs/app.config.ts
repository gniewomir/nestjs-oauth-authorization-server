import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { IsIn, IsInt, IsNotEmpty, IsString } from "class-validator";

import { provide } from "@infrastructure/config/utility/provide";
import { logLevels } from "@infrastructure/logger/logger.interface";

import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";

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
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("AppConfig factory");
        return await provide(
          "app",
          "AppConfig",
          AppConfig,
          logger,
          nestConfigService,
          {
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
              envKey: "NODE_ENV",
              description:
                "Current application environment.\n" +
                '"development" & "test" are lenient when it comes to error reporting & configuration.\n' +
                '"production" limits error reporting outside logs and enforces stricter configuration.',
              allowed: acceptedEnvs,
            },
          },
          AppConfig.defaults(),
        );
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
