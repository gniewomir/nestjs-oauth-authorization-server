import { Module } from "@nestjs/common";
import { ApiModule } from "../../interface/api";
import { LoggerModule } from "../logger";

@Module({
  imports: [ApiModule, LoggerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
