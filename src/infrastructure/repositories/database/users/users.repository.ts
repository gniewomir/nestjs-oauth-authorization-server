import { InjectRepository } from "@nestjs/typeorm";
import { User } from "@infrastructure/database/entities/user.entity";
import { Repository } from "typeorm";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  create() {
    this.userRepository.create();
  }
}
