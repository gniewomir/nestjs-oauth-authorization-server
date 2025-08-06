import { IsInt, IsNotEmpty } from "class-validator";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";
import { plainToInstance } from "class-transformer";
import { configValidator } from "./utility/configValidator";
import { deepFreeze } from "./utility/deepFreeze";
import { Injectable } from "@nestjs/common";

@Injectable()
export class OrderingConfig {
  @IsNotEmpty()
  @IsInt()
  maxEntitiesPerAssigned: number = 100_000;

  @IsNotEmpty()
  @IsInt()
  ordinalNumbersSpacing: number = Math.floor(Number.MAX_SAFE_INTEGER / 100_000);

  @IsNotEmpty()
  @IsInt()
  maxOrdinalNumber: number = Number.MAX_SAFE_INTEGER;

  public static provider(): Provider {
    return {
      provide: OrderingConfig,
      useFactory: async (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("TasksConfig factory");
        const maxEntitiesPerAssigned = 100_000;
        const maxOrdinalNumber = Number.MAX_SAFE_INTEGER;
        const config = plainToInstance<OrderingConfig, Record<string, unknown>>(
          OrderingConfig,
          {
            maxEntitiesPerAssigned,
            maxOrdinalNumber,
            ordinalNumbersSpacing: Math.floor(
              maxOrdinalNumber / maxEntitiesPerAssigned,
            ),
          },
        );
        const validated = await configValidator(config, logger);

        return deepFreeze(validated);
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
