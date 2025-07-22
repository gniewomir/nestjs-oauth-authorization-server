import { Module } from "@nestjs/common";
import { ApiModule } from "../../interface/api";

@Module({
  imports: [ApiModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
