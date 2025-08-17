import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { randomString } from "@test/utility/randomString";
import { plainToInstance } from "class-transformer";
import { IsInt, IsNotEmpty, IsString, Length, Max } from "class-validator";
import { Algorithm } from "jsonwebtoken";

import {
  ONE_DAY_IN_SECONDS,
  ONE_HOUR_IN_SECONDS,
  ONE_MINUTE_IN_SECONDS,
} from "@infrastructure/clock";
import {
  configValidator,
  deepFreeze,
} from "@infrastructure/config/configs/utility";
import { LoggerInterface, LoggerInterfaceSymbol } from "@infrastructure/logger";

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
  @Length(64, 64)
  jwtSecret: string;

  @IsNotEmpty()
  @IsString()
  jwtAlgorithm: Algorithm;

  @IsNotEmpty()
  @IsInt()
  @Max(10 * ONE_MINUTE_IN_SECONDS)
  oauthAuthorizationCodeExpirationSeconds: number;

  public static defaults(): AuthConfig {
    return {
      passwordSaltingRounds: 10,
      jwtAlgorithm: "HS256" satisfies Algorithm,
      jwtSecret: randomString(64),
      jwtIssuer: "Gniewomir Świechowski <gniewomir.swiechowski@gmail.com>",
      jwtAccessTokenExpirationSeconds: ONE_MINUTE_IN_SECONDS * 5,
      jwtRefreshTokenExpirationSeconds: ONE_HOUR_IN_SECONDS,
      jwtLongTTLRefreshTokenExpirationSeconds: ONE_DAY_IN_SECONDS * 14,
      oauthAuthorizationCodeExpirationSeconds: ONE_MINUTE_IN_SECONDS * 2,
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
        const config = plainToInstance(AuthConfig, {
          ...AuthConfig.defaults(),
          jwtSecret: nestConfigService.get("AUTH_SECRET") || "",
        } satisfies AuthConfig);
        return deepFreeze(configValidator(config, logger));
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
