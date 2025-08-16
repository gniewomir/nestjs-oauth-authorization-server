import "reflect-metadata"; // as required by class-transformer

import { bootstrap } from "@application/app";

void bootstrap().then(async ({ app, logger, appConfig }) => {
  logger.setContext("bootstrap");
  logger.log(`Server => ${await app.getUrl()}`);
  logger.log(`Environment => ${appConfig.env}`);
});
