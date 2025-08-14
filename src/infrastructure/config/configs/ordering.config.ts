import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { ConfigService } from "@nestjs/config";
import { plainToInstance } from "class-transformer";

// Intentionally left without validators for now
import { LoggerInterface, LoggerInterfaceSymbol } from "../../logger";

import { deepFreeze } from "./utility/deepFreeze";

@Injectable()
export class OrderingConfig {
  // Placeholder to keep provider wiring intact for now
  public static provider(): Provider {
    return {
      provide: OrderingConfig,
      useFactory: (
        nestConfigService: ConfigService,
        logger: LoggerInterface,
      ) => {
        logger.setContext("TasksConfig factory");
        const config = plainToInstance<OrderingConfig, Record<string, unknown>>(
          OrderingConfig,
          {},
        );
        return Promise.resolve(deepFreeze(config));
      },
      inject: [ConfigService, LoggerInterfaceSymbol],
    };
  }
}
