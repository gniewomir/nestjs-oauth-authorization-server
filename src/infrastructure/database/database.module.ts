import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../config";
import { DatabaseConfig } from "@infrastructure/config/configs";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
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
