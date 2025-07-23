import { Module } from "@nestjs/common";
import { ApiModule } from "../../interface/api";
import { LoggerModule } from "../logger";
import { ConfigModule } from "../config";

@Module({
  imports: [ApiModule, LoggerModule, ConfigModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
