import * as assert from "node:assert";

import { cliBootstrap } from "@application/app";
import {
  ConfigService,
  TRegisteredEnvVariable,
} from "@infrastructure/config/config.service";
import { EnvModule } from "@interface/cli/env/env.module";

const describeUsage = () => {
  render([
    "Usage:",
    `${"".padEnd(5, " ")}help`.padEnd(20, " ") + "Print available commands.",
    `${"".padEnd(5, " ")}merge`.padEnd(20, " ") +
      "Merge current .env with defaults and print new env file to console.",
    `${"".padEnd(5, " ")}default`.padEnd(20, " ") +
      "Print default .env file to console.",
  ]);
};

const envValue = (val: TRegisteredEnvVariable, command: string) => {
  let res;
  res = command === "merge" ? val.envVariableValue : val.configDefaultValue;
  res = command === "default" ? val.configDefaultValue : res;
  assert(typeof res === "string");
  res = res.trim();
  return res.includes(" ") ? `"${res}"` : res;
};

const render = (lines: string[]) => {
  lines.forEach((line) => console.log(`${line.trim()}`));
};

void cliBootstrap({
  name: "env",
  baseModule: EnvModule,
  payload: ({ application }) => {
    const args = process.argv.slice(2);
    const command = args.shift() || "help";

    if (
      !["help", "merge", "default"].includes(command) ||
      args.shift() !== undefined
    ) {
      console.error(`Unrecognized argument`);
      describeUsage();
      return Promise.resolve();
    }
    if (command === "help") {
      describeUsage();
      return Promise.resolve();
    }

    const configService = application.get(ConfigService);
    const envByConfig = configService.registered().reduce(
      (carry, val) => {
        if (!(val.configName in carry)) {
          const title = `${"".padEnd(5, "#")} ${val.configName} ${"".padEnd(5, "#")}`;
          carry[val.configName] = [
            "".padEnd(title.length, "#"),
            title,
            "".padEnd(title.length, "#"),
            "",
          ];
        }
        carry[val.configName].push(
          ...[
            `# ${val.envVariableName} -> ${val.configName}.${val.configKey} ${val.allowDefault ? "(optional)" : "(required)"}`,
            `# DEFAULT/EXAMPLE: ${val.configDefaultValue}`,
            ...(val.description
              ? val.description.split("\n")
              : [`# ${val.description}`]
            ).map((line) => `# ${line}`),
            ...(val.allowed ? [`# ALLOWED: ${val.allowed.join(", ")}`] : []),
            ...(val.arraySeparator
              ? [`# VALUES SEPARATOR (double-quoted): "${val.arraySeparator}"`]
              : []),
            `${val.envVariableName}=${envValue(val, command)}`,
            "",
          ],
        );
        return carry;
      },
      {} as Record<string, string[]>,
    );

    render([
      `# BEGIN ENV FILE`,
      "",
      `# NOTE: empty values i.e. "APP_PORT=" will fallback to default value.`,
      "",
      ...Object.values(envByConfig).flat(),
      `# END ENV FILE`,
    ]);

    return Promise.resolve();
  },
});
