import { ConfigService as NestConfigService } from "@nestjs/config";

import { cliBootstrap } from "@application/app";
import {
  ConfigService,
  TRegisteredEnvVariable,
} from "@infrastructure/config/config.service";
import { EnvModule } from "@interface/cli/env/env.module";

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

const describeConfig = (val: TRegisteredEnvVariable) => {
  const title = `${"".padEnd(5, "#")} ${val.configName} ${"".padEnd(5, "#")}`;
  console.log("".padEnd(title.length, "#"));
  console.log(title);
  console.log("".padEnd(title.length, "#"));
};

const describeEnv = (
  val: TRegisteredEnvVariable,
  command: string,
  nestConfigService: NestConfigService,
) => {
  console.log(
    `# ${val.envVariableName} -> ${val.configName}.${val.configKey} ${val.allowDefault ? "(optional)" : "(required)"}`,
  );
  console.log(`# DEFAULT/EXAMPLE: ${String(val.configDefaultValue)}`);
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
      `${val.envVariableName}=${String(nestConfigService.get(val.envVariableName) || val.configDefaultValue).trim()}`,
    );
  } else {
    console.log(
      `${val.envVariableName}=${String(val.configDefaultValue).trim()}`,
    );
  }
};

void cliBootstrap({
  name: "env",
  baseModule: EnvModule,
  payload: ({ application }) => {
    const args = process.argv.slice(2);
    const command = args.shift() || "help";

    if (!["help", "merge", "default"].includes(command)) {
      console.error(`Unrecognized command "${command}"`);
      describeUsage();
    }
    if (command === "help") {
      describeUsage();
      return Promise.resolve();
    }

    console.log("Gathering env variables...");

    console.log(`# BEGIN ENV FILE\n`);
    const configService = application.get(ConfigService);

    configService.registered().reduce(
      (acc, val) => {
        if (val.configName in acc) {
          acc[val.configName].push(val);
        } else {
          describeConfig(val);
          console.log("");

          acc[val.configName] = [];
        }

        describeEnv(val, command, application.get(NestConfigService));
        console.log("");

        return acc;
      },
      {} as Record<string, TRegisteredEnvVariable[]>,
    );
    console.log(`# END ENV FILE`);

    return Promise.resolve();
  },
});
