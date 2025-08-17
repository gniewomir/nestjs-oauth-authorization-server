import "reflect-metadata"; // as required by class-transformer

import { applicationBootstrap } from "@application/app";

void applicationBootstrap().then(async ({ app, logger, appConfig }) => {
  logger.info(`Server => ${await app.getUrl()}`);
  logger.info(`Environment => ${appConfig.env}`);
});
