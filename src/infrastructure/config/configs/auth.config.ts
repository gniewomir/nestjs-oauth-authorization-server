import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { IsIn, IsInt, IsNotEmpty, IsString, Max } from "class-validator";
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

  public static defaults(): AuthConfig {
    return {
      passwordSaltingRounds: 10,
      jwtAlgorithm: "ES512" satisfies Algorithm,
      jwtKeyPath: "src/test/keys/ours-key-es512",
      jwtIssuer: "Gniewomir Świechowski <gniewomir.swiechowski@gmail.com>",
      jwtAccessTokenExpirationSeconds: ONE_MINUTE_IN_SECONDS * 5,
      jwtRefreshTokenExpirationSeconds: ONE_HOUR_IN_SECONDS,
      jwtLongTTLRefreshTokenExpirationSeconds: ONE_DAY_IN_SECONDS * 14,
      oauthAuthorizationCodeExpirationSeconds: ONE_MINUTE_IN_SECONDS * 5,
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
          },
        });
      },
      inject: [ConfigService],
    };
  }
}
