import { cliBootstrapNoLogging } from "@application/app";
import {
  inspectRegistry,
  TConfigurationVariable,
} from "@infrastructure/config/utility/provide";
import { EnvModule } from "@interface/cli/env/env.module";

void cliBootstrapNoLogging({
  name: "docs:env",
  baseModule: EnvModule,
  payload: () => {
    const describeConfig = (val: TConfigurationVariable) => {
      const title = `${"".padEnd(5, "#")} ${val.configName} ${"".padEnd(5, "#")}`;
      console.log("".padEnd(title.length, "#"));
      console.log(title);
      console.log("".padEnd(title.length, "#"));
    };

    const describeEnv = (val: TConfigurationVariable) => {
      console.log(
        `# ${val.envKey} -> ${val.configName}.${val.configKey} ${val.required ? "(required)" : "(optional)"}`,
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
      }
      console.log(`${val.envKey}=${String(val.defaultValue).trim()}`);
    };

    console.log(`# BEGIN ENV FILE\n\n`);
    inspectRegistry().reduce(
      (acc, val) => {
        if (val.configName in acc) {
          acc[val.configName].push(val);
        } else {
          describeConfig(val);
          console.log("\n");

          acc[val.configName] = [];
        }

        describeEnv(val);
        console.log("\n");

        return acc;
      },
      {} as Record<string, TConfigurationVariable[]>,
    );
    console.log(`# END ENV FILE`);

    return Promise.resolve();
  },
});
