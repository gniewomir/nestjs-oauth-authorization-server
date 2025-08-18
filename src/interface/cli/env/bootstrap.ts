import { cliBootstrap } from "@application/app";
import { inspectRegistry } from "@infrastructure/config/utility/provide";
import { EnvModule } from "@interface/cli/env/env.module";

void cliBootstrap({
  name: "docs:env",
  baseModule: EnvModule,
  payload: ({ logger }) => {
    logger.setContext("docs:env");
    console.log(inspectRegistry());
    return Promise.resolve();
  },
});
