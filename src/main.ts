import "reflect-metadata"; // as required by class-transformer

import { appBootstrap } from "@application/app";

void appBootstrap().then(async ({ app, logger, appConfig }) => {
  logger.info(`Server => ${await app.getUrl()}`);
  logger.info(`Environment => ${appConfig.env}`);
});
