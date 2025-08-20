import { Injectable } from "@nestjs/common";
import { Provider } from "@nestjs/common/interfaces/modules/provider.interface";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

import { ConfigService } from "../config.service";

@Injectable()
export class HtmlConfig {
  @IsNotEmpty()
  @IsBoolean()
  templateCache: boolean;

  @IsNotEmpty()
  @IsString()
  projectTitle: string;

  public static defaults(): HtmlConfig {
    return {
      templateCache: true,
      projectTitle: "Enraged - OAuth Authorization Server",
    };
  }

  public static provider(): Provider {
    return {
      provide: HtmlConfig,
      useFactory: async (configService: ConfigService) => {
        return configService.provide({
          configName: "HtmlConfig",
          configCls: HtmlConfig,
          envVariablesPrefix: "html",
          options: {
            templateCache: {
              allowDefault: true,
              description:
                "Do precompiled templates should be cached or fetched form disk and compiled on each request.",
            },
            projectTitle: {
              allowDefault: true,
              description:
                "Project title used in templates as page title component.",
            },
          },
          defaults: HtmlConfig.defaults(),
        });
      },
      inject: [ConfigService],
    };
  }
}
