import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { IdentityValue } from "@domain/IdentityValue";
import { Assigned } from "@domain/tasks/assigned/Assigned";
import { AssignedInterface } from "@domain/tasks/assigned/Assigned.interface";
import { User as DatabaseUser } from "@infrastructure/database/entities/user.entity";

@Injectable()
export class AssignedDomainRepository implements AssignedInterface {
  constructor(
    @InjectRepository(DatabaseUser)
    private readonly userRepository: Repository<DatabaseUser>,
  ) {}

  async retrieve(identity: IdentityValue): Promise<Assigned> {
    const user = await this.userRepository.findOne({
      where: { id: identity.toString() },
    });

    if (!user) {
      throw new Error("Assigned not found");
    }

    return new Assigned({ identity: IdentityValue.fromString(user.id) });
  }
}
