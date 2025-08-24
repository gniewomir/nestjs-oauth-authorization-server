import * as assert from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

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
  return lines
    .map((line) => `${line.trim()}${os.EOL}`)
    .reduce((carry, val) => carry + val, "");
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

    const content = render([
      `# BEGIN ENV FILE`,
      "",
      `# NOTE: empty values i.e. "APP_PORT=" will fallback to default value.`,
      `# NOTE: \`npm run env:merge:save\` will drop all environment variables not registered in configuration!`,
      "",
      ...Object.values(envByConfig).flat(),
      `# END ENV FILE`,
    ]);
    const file =
      command === "merge"
        ? path.join(__dirname, "..", "..", "..", "..", ".env")
        : path.join(__dirname, "..", "..", "..", "..", ".env.dist");

    fs.writeFileSync(file, content, "utf8");

    return Promise.resolve();
  },
});
