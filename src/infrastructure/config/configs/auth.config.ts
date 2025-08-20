import * as assert from "node:assert";

import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
} from "class-validator";
import { Algorithm } from "jsonwebtoken";

import {
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
  ONE_MINUTE_IN_SECONDS,
} from "@infrastructure/clock";
import {
  assertValidPrivateKey,
  assertValidPublicKey,
} from "@infrastructure/config/utility/assertions";

import { ConfigService } from "../config.service";

const allowedAlgorithms = ["ES512"];

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
  unprotectedPaths: string[];

  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  forbiddenPaths: string[];

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
      unprotectedPaths: [
        "/dev*",
        "/status*",
        "/oauth*",
        "/favicon.ico*",
        "/api/v1/user/register*",
      ],
      forbiddenPaths: ["/dev*"],
    };
  }

  public static provider(): Provider {
    return {
      provide: AuthConfig,
      useFactory: async (configService: ConfigService) => {
        return await configService.provide({
          envVariablesPrefix: "auth",
          configName: "AuthConfig",
          configCls: AuthConfig,
          defaults: AuthConfig.defaults(),
          options: {
            jwtAlgorithm: {
              allowDefault: true,
              description: "Algorithm used for signing JWT tokens.",
              allowed: allowedAlgorithms,
            },
            jwtKeyPath: {
              allowDefault: false,
              description:
                "Path to private key used to sign jwt tokens (absolute or relative to the project root)",
              validator: async (config) => {
                await assertValidPrivateKey(config.jwtKeyPath);
                await assertValidPublicKey(`${config.jwtKeyPath}.pub`);

                return Promise.resolve();
              },
            },
            unprotectedPaths: {
              allowDefault: true,
              description:
                "Api paths that won't be protected by authentication middleware.\n" +
                'They have to start with a "/", and can end with a "*" wildcard.\n' +
                "Without wildcard only exact match will be unprotected.\n" +
                "With wildcard all requests matching path will be unprotected.\n" +
                'Provided values must be separated by ",".',
              isArray: true,
              arraySeparator: ",",
              arrayTrim: true,
              validator: (config) => {
                assert(
                  config.unprotectedPaths.every((val) => val.startsWith("/")),
                  'Every path on unprotected paths list have to start with "/".',
                );
                assert(
                  config.unprotectedPaths.every((val) => val !== "/*"),
                  'Overly broad wildcards like "/*" are not allowed on unprotected paths list.',
                );
                return Promise.resolve();
              },
            },
            forbiddenPaths: {
              allowDefault: true,
              description:
                "Api paths that always will return 403.\n" +
                "Intended as a way to ensure routes useful in dev won't be exposed in production.\n" +
                'They have to start with a "/", and can end with a "*" wildcard.\n' +
                "Without wildcard only exact match will be unprotected.\n" +
                "With wildcard all requests matching path will be unprotected.\n" +
                'Provided values must be separated by ",".',
              isArray: true,
              arraySeparator: ",",
              arrayTrim: true,
              validator: (config) => {
                assert(
                  config.unprotectedPaths.every((val) => val.startsWith("/")),
                  'Every path on unprotected paths list have to start with "/".',
                );
                assert(
                  config.unprotectedPaths.every((val) => val !== "/*"),
                  'Overly broad wildcards like "/*" are not allowed on unprotected paths list.',
                );
                return Promise.resolve();
              },
            },
          },
        });
      },
      inject: [ConfigService],
    };
  }
}
