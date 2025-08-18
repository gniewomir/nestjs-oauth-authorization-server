import * as process from "node:process";

import { registerAs } from "@nestjs/config";
import { config as dotenvConfig } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

dotenvConfig({ path: __dirname + "/../../../.env" });

/**
 * In production environment we will be running transpiled JavaScript, not TypeScript
 */
const isProduction = process.env.NODE_ENV === "production";

const config = {
  type: "postgres",
  host: `${process.env.DB_HOST}`,
  port: `${process.env.DB_PORT}`,
  username: `${process.env.DB_USER}`,
  password: `${process.env.DB_PASSWORD}`,
  database: `${process.env.DB_DATABASE}`,
  entities: [__dirname + `/entities/*.entity.${isProduction ? "js" : "ts"}`],
  migrations: [__dirname + `/migrations/*.${isProduction ? "js" : "ts"}`],
  autoLoadEntities: true,
  synchronize: false,
};

export default registerAs("typeorm", () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
