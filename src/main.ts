import "reflect-metadata"; // as required by class-transformer

import { applicationBootstrap } from "@application/app";

void applicationBootstrap().then(async ({ app, logger, appConfig }) => {
  logger.setContext("bootstrap");
  logger.log(`Server => ${await app.getUrl()}`);
  logger.log(`Environment => ${appConfig.env}`);
});
