import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";
import { UserDomainRepository } from "./User.domain-repository";

@Module({
  imports: [TypeOrmModule.forFeature([DatabaseUser])],
  providers: [UserDomainRepository],
  exports: [UserDomainRepository],
})
export class UserDomainRepositoryModule {}
