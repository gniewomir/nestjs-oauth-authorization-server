import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AppConfigModule } from "../app-config";
import { DatabaseConfig } from "../app-config/configs";

@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: (databaseConfig: DatabaseConfig) => ({
        type: "postgres",
        host: databaseConfig.host,
        port: databaseConfig.port,
        username: databaseConfig.user,
        password: databaseConfig.password,
        database: databaseConfig.database,
        entities: [__dirname + "/entities/**/*.entity{.ts,.js}"],
        migrations: ["dist/infrastructure/database/migrations/*{.ts,.js}"],
        autoLoadEntities: true,
        synchronize: false,
      }),
      inject: [DatabaseConfig],
    }),
  ],
})
export class DatabaseModule {}
