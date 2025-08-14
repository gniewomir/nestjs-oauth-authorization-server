import { Module } from "@nestjs/common";

import { StatusModule } from "./status";

@Module({
  imports: [StatusModule],
  controllers: [],
  providers: [],
})
export class ApiModule {}
