import * as constants from "node:constants";
import * as fs from "node:fs";

import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
} from "class-validator";
import { Algorithm } from "jsonwebtoken";

import { Assert } from "@domain/Assert";
import {
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
  ONE_MINUTE_IN_SECONDS,
} from "@infrastructure/clock";
import { provide } from "@infrastructure/config/utility/provide";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";

const allowedAlgorithms = ["ES512"];

function assertFileIsReadable(filePath: string, message: string) {
  try {
    fs.accessSync(filePath, constants.R_OK);
  } catch (error) {
    throw new Error(message, { cause: error });
  }
}

export class AuthConfig {
  @IsNotEmpty()
  @IsInt()
  passwordSaltingRounds: number;

  @IsNotEmpty()
  @IsString()
  jwtIssuer: string;

  @IsNotEmpty()
  @IsInt()
  @Max(ONE_MINUTE_IN_SECONDS * 30)
  jwtAccessTokenExpirationSeconds: number;

  @IsNotEmpty()
  @IsInt()
  @Max(ONE_DAY_IN_SECONDS)
  jwtRefreshTokenExpirationSeconds: number;

  @IsNotEmpty()
  @IsInt()
  @Max(ONE_DAY_IN_SECONDS * 14)
  jwtLongTTLRefreshTokenExpirationSeconds: number;

  @IsNotEmpty()
  @IsString()
  jwtKeyPath: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(allowedAlgorithms)
  jwtAlgorithm: Algorithm;

  @IsNotEmpty()
  @IsInt()
  @Max(10 * ONE_MINUTE_IN_SECONDS)
  oauthAuthorizationCodeExpirationSeconds: number;

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  authUnprotectedPaths: string[];

  public static defaults(): AuthConfig {
    return {
      passwordSaltingRounds: 10,
      jwtAlgorithm: "ES512" satisfies Algorithm,
      jwtKeyPath: "keys/ours-key-es512",
      jwtIssuer: "Gniewomir Świechowski <gniewomir.swiechowski@gmail.com>",
      jwtAccessTokenExpirationSeconds: ONE_MINUTE_IN_SECONDS * 5,
      jwtRefreshTokenExpirationSeconds: ONE_HOUR_IN_SECONDS,
      jwtLongTTLRefreshTokenExpirationSeconds: ONE_DAY_IN_SECONDS * 14,
      oauthAuthorizationCodeExpirationSeconds: ONE_MINUTE_IN_SECONDS * 2,
      authUnprotectedPaths: ["/status*", "/oauth/*"],
    };
  }

  public static provider(): Provider {
    return {
      provide: AuthConfig,
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("AuthConfig factory");
        const config = await provide(
          "auth",
          "AuthConfig",
          AuthConfig,
          logger,
          nestConfigService,
          {
            jwtAlgorithm: {
              allowDefault: true,
              description: "Algorithm used for signing JWT tokens.",
              allowed: allowedAlgorithms,
            },
            jwtKeyPath: {
              allowDefault: false,
              description:
                "Path to private key used to sign jwt tokens (absolute or relative to the project root)",
            },
            authUnprotectedPaths: {
              allowDefault: true,
              description:
                "Api paths that won't be protected by authentication middleware.\n" +
                'They have to start with a "/", and can end with a "*" wildcard.\n' +
                "Without wildcard only exact match will be unprotected.\n" +
                "With wildcard all requests matching path will be unprotected.\n" +
                'Provided values must be separated by "|".',
              isArray: true,
              arraySeparator: "|",
              arrayTrim: true,
            },
          },
          AuthConfig.defaults(),
        );

        assertFileIsReadable(
          config.jwtKeyPath,
          `Cannot read private key file ${config.jwtKeyPath}`,
        );

        assertFileIsReadable(
          `${config.jwtKeyPath}.pub`,
          `Cannot read public key file ${config.jwtKeyPath}.pub`,
        );

        Assert(
          config.authUnprotectedPaths.every((val) => val.startsWith("/")),
          'Every path on unprotected routes list have to start with "/".',
        );

        return config;
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
