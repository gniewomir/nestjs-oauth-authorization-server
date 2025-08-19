import { ConfigService } from "@nestjs/config";

import { cliBootstrap } from "@application/app";
import {
  inspectRegistry,
  TConfigurationVariable,
} from "@infrastructure/config/utility/provide";
import { EnvModule } from "@interface/cli/env/env.module";

void cliBootstrap({
  name: "env",
  baseModule: EnvModule,
  payload: ({ application }) => {
    const args = process.argv.slice(2);
    const command = args.shift();

    const describeUsage = () => {
      console.log("Usage:");
      console.log(
        `${"".padEnd(5, " ")}help`.padEnd(20, " "),
        "Print available commands.",
      );
      console.log(
        `${"".padEnd(5, " ")}merge`.padEnd(20, " "),
        "Merge current .env with defaults and print new env file to console.",
      );
      console.log(
        `${"".padEnd(5, " ")}default`.padEnd(20, " "),
        "Print default .env file to console.",
      );
    };

    if (!["help", "merge", "default"].includes(command || "")) {
      console.error(`Unrecognized command "${command}"`);
      describeUsage();
    }
    if (command === "help") {
      describeUsage();
      return Promise.resolve();
    }

    console.log("Gathering env variables...");

    const nestConfigService = application.get<ConfigService>(ConfigService);

    const describeConfig = (val: TConfigurationVariable) => {
      const title = `${"".padEnd(5, "#")} ${val.configName} ${"".padEnd(5, "#")}`;
      console.log("".padEnd(title.length, "#"));
      console.log(title);
      console.log("".padEnd(title.length, "#"));
    };

    const describeEnv = (val: TConfigurationVariable) => {
      console.log(
        `# ${val.envKey} -> ${val.configName}.${val.configKey} ${val.allowDefault ? "(optional)" : "(required)"}`,
      );
      console.log(`# DEFAULT/EXAMPLE: ${String(val.defaultValue)}`);
      if (val.description) {
        const split = val.description.split("\n");
        if (split.length > 1) {
          console.log(`# DESCRIPTION:`);
          for (const line of split) {
            console.log(`# ${line}`);
          }
        } else {
          console.log(`# DESCRIPTION: ${val.description}`);
        }
        if (val.allowed) {
          console.log(`# ALLOWED: ${val.allowed.join(", ")}`);
        }
      }
      if (command === "merge") {
        console.log(
          `${val.envKey}=${String(nestConfigService.get(val.envKey) || val.defaultValue).trim()}`,
        );
      } else {
        console.log(`${val.envKey}=${String(val.defaultValue).trim()}`);
      }
    };

    console.log(`# BEGIN ENV FILE\n`);
    inspectRegistry().reduce(
      (acc, val) => {
        if (val.configName in acc) {
          acc[val.configName].push(val);
        } else {
          describeConfig(val);
          console.log("");

          acc[val.configName] = [];
        }

        describeEnv(val);
        console.log("");

        return acc;
      },
      {} as Record<string, TConfigurationVariable[]>,
    );
    console.log(`# END ENV FILE`);

    return Promise.resolve();
  },
});
