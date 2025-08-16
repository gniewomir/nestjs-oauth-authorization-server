import "reflect-metadata"; // as required by class-transformer

import { bootstrap } from "@application/app";

void bootstrap().then(async ({ app, logger }) => {
  logger.setContext("bootstrap");
  logger.log(`Server is running on ${await app.getUrl()}`);
});
