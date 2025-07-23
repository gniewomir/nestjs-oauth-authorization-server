import { registerAs } from "@nestjs/config";
import { config as dotenvConfig } from "dotenv";
import { DataSource, DataSourceOptions } from "typeorm";

dotenvConfig({ path: __dirname + "/../../../.env" });

const config = {
  type: "postgres",
  host: `${process.env.DATABASE_HOST}`,
  port: `${process.env.DATABASE_PORT}`,
  username: `${process.env.DATABASE_USER}`,
  password: `${process.env.DATABASE_PASSWORD}`,
  database: `${process.env.DATABASE_NAME}`,
  entities: ["dist/infrastructure/database/entities/**/*.entity{.ts,.js}"],
  migrations: ["dist/infrastructure/database/migrations/*{.ts,.js}"],
  autoLoadEntities: true,
  synchronize: false,
};

export default registerAs("typeorm", () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
